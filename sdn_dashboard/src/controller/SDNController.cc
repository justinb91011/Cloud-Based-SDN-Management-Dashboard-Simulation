#include "SDNController.h"
#include <inet/common/ModuleAccess.h>
#include <inet/common/packet/Packet.h>
#include <inet/networklayer/ipv4/Ipv4Header_m.h>
#include <fstream>
#include <iostream>

namespace sdn_dashboard {

}

using namespace sdn_dashboard;
using namespace omnetpp;

Define_Module(SDNControllerApp);

namespace sdn_dashboard {

SDNControllerApp::SDNControllerApp()
{
    nextFlowId = 1;
    nextSliceId = 1;
    stateFile = nullptr;
    checkCommandTimer = nullptr;
}

SDNControllerApp::~SDNControllerApp()
{
    if (stateFile) {
        stateFile->close();
        delete stateFile;
    }
    if (checkCommandTimer) {
        cancelAndDelete(checkCommandTimer);
    }
}

void SDNControllerApp::initialize(int stage)
{
    ApplicationBase::initialize(stage);

    if (stage == INITSTAGE_LOCAL) {
        localPort = par("localPort");
        sliceConfigFile = par("sliceConfigFile").stdstringValue();
        flowConfigFile = par("flowConfigFile").stdstringValue();

        // Register signals
        flowInstalledSignal = registerSignal("flowInstalled");
        sliceCreatedSignal = registerSignal("sliceCreated");
        flowRemovedSignal = registerSignal("flowRemoved");

        EV << "SDN Controller initializing on port " << localPort << endl;
    }
    else if (stage == INITSTAGE_APPLICATION_LAYER) {
        socket.setOutputGate(gate("socketOut"));
        socket.bind(localPort);

        // Load initial configuration
        loadConfiguration();

        // Open state file for external communication
        std::string stateFilePath = "results/controller_state.json";
        stateFile = new std::ofstream(stateFilePath);

        // Setup command file path
        commandFile = "results/commands.json";
        lastCommandCheck = simTime();

        // Schedule periodic command checking
        checkCommandTimer = new cMessage("checkCommands");
        scheduleAt(simTime() + 1.0, checkCommandTimer);

        // Export initial state
        saveState();
        exportTopology();

        EV << "Command processing enabled. Checking " << commandFile << " every 1 second." << endl;
    }
}

void SDNControllerApp::handleMessageWhenUp(cMessage *msg)
{
    if (msg == checkCommandTimer) {
        // Periodic command processing
        processCommands();
        // Schedule next check
        scheduleAt(simTime() + 1.0, checkCommandTimer);
        return;
    }
    else if (socket.belongsToSocket(msg)) {
        Packet *packet = check_and_cast<Packet *>(msg);
        processPacket(packet);
    }
    else {
        delete msg;
    }
}

void SDNControllerApp::processPacket(Packet *packet)
{
    // Process incoming packets from switches
    EV << "Controller received packet" << endl;

    // TODO: Implement OpenFlow message handling
    // For now, just log and delete

    delete packet;
}

void SDNControllerApp::installFlowRule(const FlowRule &rule)
{
    FlowRule newRule = rule;
    newRule.flowId = nextFlowId++;
    newRule.installedTime = simTime();
    newRule.packetsMatched = 0;
    newRule.bytesMatched = 0;

    flowTable[newRule.flowId] = newRule;

    emit(flowInstalledSignal, (long)newRule.flowId);

    EV << "Installed flow rule " << newRule.flowId
       << " from " << newRule.srcIP << " to " << newRule.dstIP << endl;

    saveState();
}

void SDNControllerApp::removeFlowRule(int flowId)
{
    auto it = flowTable.find(flowId);
    if (it != flowTable.end()) {
        flowTable.erase(it);
        emit(flowRemovedSignal, (long)flowId);
        EV << "Removed flow rule " << flowId << endl;
        saveState();
    }
}

void SDNControllerApp::createSlice(const NetworkSlice &slice)
{
    NetworkSlice newSlice = slice;
    newSlice.sliceId = nextSliceId++;
    newSlice.createdTime = simTime();

    slices[newSlice.sliceId] = newSlice;

    emit(sliceCreatedSignal, (long)newSlice.sliceId);

    EV << "Created network slice " << newSlice.sliceId
       << " (" << newSlice.name << ")" << endl;

    // Install default flows for slice isolation
    for (const auto &hostIP : newSlice.hostIPs) {
        FlowRule rule;
        rule.srcIP = hostIP;
        rule.dstIP = "";  // Any destination within slice
        rule.srcPort = 0;
        rule.dstPort = 0;
        rule.action = "forward";
        rule.outputPort = 0;
        rule.priority = 100;
        rule.sliceId = newSlice.sliceId;
        installFlowRule(rule);
    }

    saveState();
}

void SDNControllerApp::deleteSlice(int sliceId)
{
    auto it = slices.find(sliceId);
    if (it != slices.end()) {
        // Remove all flows associated with this slice
        std::vector<int> flowsToRemove;
        for (const auto &flow : flowTable) {
            if (flow.second.sliceId == sliceId) {
                flowsToRemove.push_back(flow.first);
            }
        }

        for (int flowId : flowsToRemove) {
            removeFlowRule(flowId);
        }

        slices.erase(it);
        EV << "Deleted network slice " << sliceId << endl;
        saveState();
    }
}

void SDNControllerApp::updateSlice(const NetworkSlice &slice)
{
    auto it = slices.find(slice.sliceId);
    if (it != slices.end()) {
        it->second = slice;
        EV << "Updated slice " << slice.sliceId << endl;
        saveState();
    }
}

void SDNControllerApp::loadConfiguration()
{
    // Load slices from config file
    // For now, create default slices

    NetworkSlice slice1;
    slice1.name = "Tenant_A";
    slice1.vlanId = 10;
    slice1.bandwidthMbps = 100;
    slice1.isolated = true;
    slice1.hostIPs = {"10.0.10.1", "10.0.10.2", "10.0.10.3", "10.0.10.4"};
    createSlice(slice1);

    NetworkSlice slice2;
    slice2.name = "Tenant_B";
    slice2.vlanId = 20;
    slice2.bandwidthMbps = 200;
    slice2.isolated = true;
    slice2.hostIPs = {"10.0.20.1", "10.0.20.2", "10.0.20.3", "10.0.20.4"};
    createSlice(slice2);

    NetworkSlice slice3;
    slice3.name = "Tenant_C";
    slice3.vlanId = 30;
    slice3.bandwidthMbps = 150;
    slice3.isolated = true;
    slice3.hostIPs = {"10.0.30.1", "10.0.30.2", "10.0.30.3", "10.0.30.4"};
    createSlice(slice3);
}

void SDNControllerApp::saveState()
{
    if (!stateFile || !stateFile->is_open()) return;

    // Clear file
    stateFile->close();
    stateFile->open("results/controller_state.json", std::ios::trunc);

    *stateFile << "{" << std::endl;
    *stateFile << "  \"timestamp\": " << simTime().dbl() << "," << std::endl;
    *stateFile << "  \"slices\": [" << std::endl;

    bool firstSlice = true;
    for (const auto &entry : slices) {
        if (!firstSlice) *stateFile << "," << std::endl;
        firstSlice = false;

        const auto &slice = entry.second;
        *stateFile << "    {" << std::endl;
        *stateFile << "      \"id\": " << slice.sliceId << "," << std::endl;
        *stateFile << "      \"name\": \"" << slice.name << "\"," << std::endl;
        *stateFile << "      \"vlanId\": " << slice.vlanId << "," << std::endl;
        *stateFile << "      \"bandwidth\": " << slice.bandwidthMbps << "," << std::endl;
        *stateFile << "      \"isolated\": " << (slice.isolated ? "true" : "false") << "," << std::endl;
        *stateFile << "      \"hosts\": [";
        for (size_t i = 0; i < slice.hostIPs.size(); i++) {
            if (i > 0) *stateFile << ", ";
            *stateFile << "\"" << slice.hostIPs[i] << "\"";
        }
        *stateFile << "]" << std::endl;
        *stateFile << "    }";
    }

    *stateFile << std::endl << "  ]," << std::endl;
    *stateFile << "  \"flows\": [" << std::endl;

    bool firstFlow = true;
    for (const auto &entry : flowTable) {
        if (!firstFlow) *stateFile << "," << std::endl;
        firstFlow = false;

        const auto &flow = entry.second;
        *stateFile << "    {" << std::endl;
        *stateFile << "      \"id\": " << flow.flowId << "," << std::endl;
        *stateFile << "      \"srcIP\": \"" << flow.srcIP << "\"," << std::endl;
        *stateFile << "      \"dstIP\": \"" << flow.dstIP << "\"," << std::endl;
        *stateFile << "      \"action\": \"" << flow.action << "\"," << std::endl;
        *stateFile << "      \"priority\": " << flow.priority << "," << std::endl;
        *stateFile << "      \"sliceId\": " << flow.sliceId << "," << std::endl;
        *stateFile << "      \"packets\": " << flow.packetsMatched << "," << std::endl;
        *stateFile << "      \"bytes\": " << flow.bytesMatched << std::endl;
        *stateFile << "    }";
    }

    *stateFile << std::endl << "  ]" << std::endl;
    *stateFile << "}" << std::endl;

    stateFile->flush();
}

void SDNControllerApp::exportTopology()
{
    std::ofstream topoFile("results/topology.json");

    topoFile << "{" << std::endl;
    topoFile << "  \"nodes\": [" << std::endl;
    topoFile << "    {\"id\": \"controller\", \"type\": \"controller\"}," << std::endl;
    topoFile << "    {\"id\": \"coreSwitch1\", \"type\": \"switch\"}," << std::endl;
    topoFile << "    {\"id\": \"coreSwitch2\", \"type\": \"switch\"}," << std::endl;

    for (int i = 0; i < 3; i++) {
        topoFile << "    {\"id\": \"aggSwitch" << i << "\", \"type\": \"switch\"}," << std::endl;
    }

    for (int i = 0; i < 3; i++) {
        topoFile << "    {\"id\": \"edgeSwitch" << i << "\", \"type\": \"switch\"}," << std::endl;
    }

    for (int i = 0; i < 12; i++) {
        topoFile << "    {\"id\": \"host" << i << "\", \"type\": \"host\", \"slice\": " << (i/4) << "}";
        if (i < 11) topoFile << ",";
        topoFile << std::endl;
    }

    topoFile << "  ]," << std::endl;
    topoFile << "  \"links\": [" << std::endl;
    // Add links here
    topoFile << "  ]" << std::endl;
    topoFile << "}" << std::endl;

    topoFile.close();
}

void SDNControllerApp::handleStartOperation(LifecycleOperation *operation)
{
    socket.bind(localPort);
}

void SDNControllerApp::handleStopOperation(LifecycleOperation *operation)
{
    socket.close();
}

void SDNControllerApp::handleCrashOperation(LifecycleOperation *operation)
{
    socket.destroy();
}

void SDNControllerApp::finish()
{
    saveState();
    ApplicationBase::finish();
}

int SDNControllerApp::addFlow(const FlowRule &rule)
{
    installFlowRule(rule);
    return rule.flowId;
}

bool SDNControllerApp::removeFlow(int flowId)
{
    removeFlowRule(flowId);
    return true;
}

int SDNControllerApp::addSlice(const NetworkSlice &slice)
{
    createSlice(slice);
    return slice.sliceId;
}

bool SDNControllerApp::removeSlice(int sliceId)
{
    deleteSlice(sliceId);
    return true;
}

void SDNControllerApp::processCommands()
{
    // Check if command file exists
    std::ifstream cmdFile(commandFile);
    if (!cmdFile.good()) {
        return; // No command file, nothing to process
    }

    // Read entire file
    std::string content((std::istreambuf_iterator<char>(cmdFile)),
                        std::istreambuf_iterator<char>());
    cmdFile.close();

    if (content.empty() || content.length() < 10) {
        return; // Empty or invalid file
    }

    EV << "Processing command from file: " << commandFile << endl;
    EV << "Command content: " << content.substr(0, 100) << "..." << endl;

    // Parse and execute command
    parseAndExecuteCommand(content);

    // Clear command file after processing
    std::ofstream clearFile(commandFile, std::ios::trunc);
    clearFile.close();

    EV << "Command processed and file cleared." << endl;
}

void SDNControllerApp::parseAndExecuteCommand(const std::string &cmdJson)
{
    // Simple string-based parsing (in production, use a proper JSON library)
    // This implementation looks for key patterns in the JSON

    try {
        if (cmdJson.find("CREATE_SLICE") != std::string::npos) {
            EV << "Executing CREATE_SLICE command" << endl;

            // Extract slice data from JSON
            NetworkSlice newSlice;

            // Parse name
            size_t namePos = cmdJson.find("\"name\":");
            if (namePos != std::string::npos) {
                size_t start = cmdJson.find("\"", namePos + 7) + 1;
                size_t end = cmdJson.find("\"", start);
                newSlice.name = cmdJson.substr(start, end - start);
            }

            // Parse vlanId
            size_t vlanPos = cmdJson.find("\"vlanId\":");
            if (vlanPos != std::string::npos) {
                size_t start = vlanPos + 9;
                size_t end = cmdJson.find_first_of(",}", start);
                newSlice.vlanId = std::stoi(cmdJson.substr(start, end - start));
            }

            // Parse bandwidth
            size_t bwPos = cmdJson.find("\"bandwidth\":");
            if (bwPos != std::string::npos) {
                size_t start = bwPos + 12;
                size_t end = cmdJson.find_first_of(",}", start);
                newSlice.bandwidthMbps = std::stod(cmdJson.substr(start, end - start));
            }

            // Parse isolated
            newSlice.isolated = (cmdJson.find("\"isolated\":true") != std::string::npos) ||
                               (cmdJson.find("\"isolated\": true") != std::string::npos);

            // Parse hosts array
            size_t hostsPos = cmdJson.find("\"hosts\":[");
            if (hostsPos != std::string::npos) {
                size_t start = hostsPos + 9;
                size_t end = cmdJson.find("]", start);
                std::string hostsStr = cmdJson.substr(start, end - start);

                // Extract individual IP addresses
                size_t pos = 0;
                while ((pos = hostsStr.find("\"", pos)) != std::string::npos) {
                    size_t ipStart = pos + 1;
                    size_t ipEnd = hostsStr.find("\"", ipStart);
                    if (ipEnd != std::string::npos) {
                        std::string ip = hostsStr.substr(ipStart, ipEnd - ipStart);
                        if (!ip.empty() && ip.find(".") != std::string::npos) {
                            newSlice.hostIPs.push_back(ip);
                        }
                        pos = ipEnd + 1;
                    } else {
                        break;
                    }
                }
            }

            // Create the slice if we have valid data
            if (!newSlice.name.empty() && newSlice.vlanId > 0 && !newSlice.hostIPs.empty()) {
                createSlice(newSlice);
                EV << "Created slice: " << newSlice.name << " with " << newSlice.hostIPs.size() << " hosts" << endl;
            } else {
                EV << "ERROR: Invalid slice data in command" << endl;
            }
        }
        else if (cmdJson.find("DELETE_SLICE") != std::string::npos) {
            EV << "Executing DELETE_SLICE command" << endl;

            // Extract slice ID
            size_t idPos = cmdJson.find("\"id\":");
            if (idPos != std::string::npos) {
                size_t start = idPos + 5;
                size_t end = cmdJson.find_first_of(",}", start);
                int sliceId = std::stoi(cmdJson.substr(start, end - start));

                deleteSlice(sliceId);
                EV << "Deleted slice ID: " << sliceId << endl;
            }
        }
        else if (cmdJson.find("UPDATE_SLICE") != std::string::npos) {
            EV << "Executing UPDATE_SLICE command" << endl;

            // Extract slice ID and updated data
            size_t idPos = cmdJson.find("\"id\":");
            if (idPos != std::string::npos) {
                size_t start = idPos + 5;
                size_t end = cmdJson.find_first_of(",}", start);
                int sliceId = std::stoi(cmdJson.substr(start, end - start));

                // Find existing slice and update it
                auto it = slices.find(sliceId);
                if (it != slices.end()) {
                    NetworkSlice updatedSlice = it->second;

                    // Update bandwidth if present
                    size_t bwPos = cmdJson.find("\"bandwidth\":");
                    if (bwPos != std::string::npos) {
                        size_t bwStart = bwPos + 12;
                        size_t bwEnd = cmdJson.find_first_of(",}", bwStart);
                        updatedSlice.bandwidthMbps = std::stod(cmdJson.substr(bwStart, bwEnd - bwStart));
                    }

                    updateSlice(updatedSlice);
                    EV << "Updated slice ID: " << sliceId << endl;
                }
            }
        }
        else if (cmdJson.find("ADD_FLOW") != std::string::npos) {
            EV << "Executing ADD_FLOW command" << endl;

            FlowRule newFlow;

            // Parse srcIP
            size_t srcPos = cmdJson.find("\"srcIP\":");
            if (srcPos != std::string::npos) {
                size_t start = cmdJson.find("\"", srcPos + 8) + 1;
                size_t end = cmdJson.find("\"", start);
                newFlow.srcIP = cmdJson.substr(start, end - start);
            }

            // Parse dstIP
            size_t dstPos = cmdJson.find("\"dstIP\":");
            if (dstPos != std::string::npos) {
                size_t start = cmdJson.find("\"", dstPos + 8) + 1;
                size_t end = cmdJson.find("\"", start);
                newFlow.dstIP = cmdJson.substr(start, end - start);
            }

            // Parse action
            size_t actionPos = cmdJson.find("\"action\":");
            if (actionPos != std::string::npos) {
                size_t start = cmdJson.find("\"", actionPos + 9) + 1;
                size_t end = cmdJson.find("\"", start);
                newFlow.action = cmdJson.substr(start, end - start);
            }

            // Parse priority
            size_t prioPos = cmdJson.find("\"priority\":");
            if (prioPos != std::string::npos) {
                size_t start = prioPos + 11;
                size_t end = cmdJson.find_first_of(",}", start);
                newFlow.priority = std::stoi(cmdJson.substr(start, end - start));
            } else {
                newFlow.priority = 100; // Default
            }

            // Parse sliceId
            size_t slicePos = cmdJson.find("\"sliceId\":");
            if (slicePos != std::string::npos) {
                size_t start = slicePos + 10;
                size_t end = cmdJson.find_first_of(",}", start);
                newFlow.sliceId = std::stoi(cmdJson.substr(start, end - start));
            }

            // Initialize other fields
            newFlow.srcPort = 0;
            newFlow.dstPort = 0;
            newFlow.outputPort = 0;

            // Install the flow if we have valid data
            if (!newFlow.srcIP.empty() && !newFlow.action.empty()) {
                installFlowRule(newFlow);
                EV << "Added flow: " << newFlow.srcIP << " -> " << newFlow.dstIP
                   << " (action: " << newFlow.action << ")" << endl;
            } else {
                EV << "ERROR: Invalid flow data in command" << endl;
            }
        }
        else if (cmdJson.find("DELETE_FLOW") != std::string::npos) {
            EV << "Executing DELETE_FLOW command" << endl;

            // Extract flow ID
            size_t idPos = cmdJson.find("\"id\":");
            if (idPos != std::string::npos) {
                size_t start = idPos + 5;
                size_t end = cmdJson.find_first_of(",}", start);
                int flowId = std::stoi(cmdJson.substr(start, end - start));

                removeFlowRule(flowId);
                EV << "Deleted flow ID: " << flowId << endl;
            }
        }
        else {
            EV << "Unknown command type in JSON" << endl;
        }
    }
    catch (const std::exception& e) {
        EV << "ERROR parsing command: " << e.what() << endl;
    }
}

} // namespace sdn_dashboard
