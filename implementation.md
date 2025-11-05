# Milestone 1 Implementation Guide: Cloud-Based SDN Management Dashboard

## Table of Contents

1. [Project Overview](#project-overview)
2. [What Needs to Be Implemented](#what-needs-to-be-implemented)
3. [Prerequisites and Environment Setup](#prerequisites-and-environment-setup)
4. [Phase 1: OMNeT++ SDN Simulation Setup](#phase-1-omnet-sdn-simulation-setup)
5. [Phase 2: Basic Cloud Topology Creation](#phase-2-basic-cloud-topology-creation)
6. [Phase 3: SDN Controller Implementation](#phase-3-sdn-controller-implementation)
7. [Phase 4: Dashboard Backend Development](#phase-4-dashboard-backend-development)
8. [Phase 5: Dashboard Frontend Development](#phase-5-dashboard-frontend-development)
9. [Phase 6: Integration and Testing](#phase-6-integration-and-testing)
10. [Validation Checklist](#validation-checklist)

---

## Project Overview

### Goal

Build a modular, experiment-driven dashboard on top of OMNeT++ that provides interactive control and visualization for two key SDN abstractions:

1. **Network Slicing**: Create/delete/configure virtual networks on shared cloud topology
2. **Dynamic Flow Provisioning**: Add/remove OpenFlow rules interactively for on-demand connections

### Current State

- OMNeT++ is installed (base installation complete)
- **Nothing else has been implemented yet** - we are starting from scratch
- All progress described in documents is aspirational/planned, not actual

### What Was Claimed as "Completed" (But Isn't Yet)

According to the milestone and presentation, the following should be working:

1. OMNeT++/INET setup with SDN modules explored
2. Basic cloud topologies with verified controller-switch communication
3. Dashboard wireframes for slice/flow management
4. Dashboard with live slice list, create/delete features
5. Flow table panel with interactive add/remove rules
6. Real-time reflection of dashboard actions in OMNeT++ simulation
7. Tested scenarios showing network state changes
8. Documentation of setup steps and module structure

---

## What Needs to Be Implemented

### Core Components

#### 1. OMNeT++ Simulation Layer

- **SDN Module Integration**

  - Install and configure INET framework
  - Install SDN4CoRE or OpenFlowOMNeTSuite modules
  - Configure OpenFlow switch and controller modules
- **Network Topology**

  - Multi-tenant cloud topology with switches, hosts, and controller
  - Minimum 3-5 switches, 10-15 hosts
  - Hierarchical topology (core switches, edge switches, hosts)
- **SDN Controller Logic**

  - Basic OpenFlow controller implementation
  - Flow table management (add/modify/delete flows)
  - Network slicing support (VLAN tagging or custom slice IDs)
  - Statistics collection and export

#### 2. Communication Bridge

- **Simulation-to-Dashboard Interface**

  - WebSocket or HTTP REST API server within OMNeT++
  - Real-time event notifications (slice created, flow added, etc.)
  - Command interface (receive dashboard commands)
  - State synchronization mechanism
- **Data Export Format**

  - JSON API for topology, slices, flows, statistics
  - Event stream format for real-time updates

#### 3. Dashboard Backend

- **Web Server**

  - Node.js/Express or Python/Flask server
  - WebSocket support for real-time updates
  - RESTful API endpoints
- **API Endpoints**

  - `GET /api/topology` - Get current network topology
  - `GET /api/slices` - List all network slices
  - `POST /api/slices` - Create new slice
  - `DELETE /api/slices/:id` - Delete slice
  - `PUT /api/slices/:id` - Update slice properties
  - `GET /api/flows` - List all flow entries
  - `POST /api/flows` - Add new flow rule
  - `DELETE /api/flows/:id` - Remove flow rule
  - `GET /api/statistics` - Get network statistics

#### 4. Dashboard Frontend

- **Technology Stack**

  - React.js or Vue.js for UI
  - D3.js or Vis.js for topology visualization
  - Material-UI or Ant Design for components
- **Key UI Components**

  - Topology visualization canvas
  - Slice management panel (list, create, delete, edit)
  - Flow table panel (list, add, remove)
  - Real-time statistics display
  - Control buttons and forms

#### 5. Network Slicing Features

- **Slice Data Model**

  - Slice ID, name, bandwidth allocation
  - List of assigned hosts/switches
  - VLAN ID or custom tagging
  - ACL rules (optional for milestone 1)
- **Slice Operations**

  - Create slice: Assign hosts, set bandwidth
  - Delete slice: Clean up flows and tags
  - Modify slice: Update properties
  - Isolate traffic between slices

#### 6. Dynamic Flow Provisioning Features

- **Flow Data Model**

  - Match fields (src/dst IP, port, VLAN)
  - Actions (forward to port, drop, modify)
  - Priority, timeout values
  - Associated slice ID
- **Flow Operations**

  - Install flow: Push to OpenFlow switch
  - Remove flow: Delete from switch
  - Modify flow: Update actions or priority
  - View flow statistics (packets, bytes)

---

## Prerequisites and Environment Setup

### Step 1: Verify OMNeT++ Installation

```bash
# Check OMNeT++ version
omnetpp -v

# Verify PATH includes OMNeT++ bin directory
echo $PATH | grep omnetpp

# Source environment if needed
cd /Users/taranagarwal/Desktop/JHUFall2025/Cloud/tj_omnet
source setenv
```

### Step 2: Install INET Framework

```bash
# Navigate to parent directory
cd /Users/taranagarwal/Desktop/JHUFall2025/Cloud

# Clone INET framework
git clone https://github.com/inet-framework/inet.git
cd inet

# Checkout stable version (4.5.x recommended for compatibility)
git checkout v4.5.2

# Build INET
make makefiles
make MODE=release -j4

# Verify build
ls out/gcc-release/src/INET
```

### Step 3: Install SDN Module (Choose One)

#### Option A: SDN4CoRE (Recommended for Real-Time Ethernet SDN)

```bash
cd /Users/taranagarwal/Desktop/JHUFall2025/Cloud

# Clone SDN4CoRE
git clone https://github.com/CoRE-RG/SDN4CoRE.git
cd SDN4CoRE

# Configure with INET
opp_configfile --make-makefile -f --deep

# Build
make MODE=release -j4
```

#### Option B: OpenFlowOMNeTSuite (Alternative)

```bash
cd /Users/taranagarwal/Desktop/JHUFall2025/Cloud

# Clone OpenFlowOMNeTSuite
git clone https://github.com/linklayer/openflow.git
cd openflow

# Build
make makefiles
make MODE=release -j4
```

### Step 4: Create Project Directory Structure

```bash
cd /Users/taranagarwal/Desktop/JHUFall2025/Cloud/tj_omnet

# Create project structure
mkdir -p sdn_dashboard/{simulations,src,dashboard}
mkdir -p sdn_dashboard/simulations/{networks,results}
mkdir -p sdn_dashboard/src/{controller,bridge,utils}
mkdir -p sdn_dashboard/dashboard/{backend,frontend}
mkdir -p sdn_dashboard/dashboard/backend/{api,websocket}
mkdir -p sdn_dashboard/dashboard/frontend/{src,public}
mkdir -p sdn_dashboard/dashboard/frontend/src/{components,services,utils}
```

### Step 5: Install Dashboard Dependencies

```bash
# Install Node.js if not present
brew install node

# Navigate to backend
cd sdn_dashboard/dashboard/backend
npm init -y
npm install express ws cors body-parser

# Navigate to frontend
cd ../frontend
npx create-react-app .
npm install axios d3 react-d3-graph material-ui
```

---

## Phase 1: OMNeT++ SDN Simulation Setup

### Task 1.1: Create NED Files for Network Topology

**File: `sdn_dashboard/simulations/networks/CloudTopology.ned`**

```ned
package sdn_dashboard.simulations.networks;

import inet.networklayer.configurator.ipv4.Ipv4NetworkConfigurator;
import inet.node.ethernet.EthernetSwitch;
import inet.node.inet.StandardHost;
import inet.visualizer.integrated.IntegratedCanvasVisualizer;

// Import SDN modules (adjust based on which SDN framework you use)
// For SDN4CoRE:
// import sdn4core.controller.OpenFlowController;
// import sdn4core.switch.OpenFlowSwitch;

// For now, using INET's basic switches as placeholder
// We'll enhance with OpenFlow later

network CloudTopology
{
    parameters:
        int numTenants = default(3);
        int hostsPerTenant = default(4);
        @display("bgb=1200,800");

    submodules:
        configurator: Ipv4NetworkConfigurator {
            @display("p=100,50");
        }

        visualizer: IntegratedCanvasVisualizer {
            @display("p=100,150");
        }

        // SDN Controller
        controller: StandardHost {
            @display("p=600,50;i=device/server2");
        }

        // Core Switches
        coreSwitch1: EthernetSwitch {
            @display("p=400,250");
        }

        coreSwitch2: EthernetSwitch {
            @display("p=800,250");
        }

        // Edge Switches (one per tenant)
        edgeSwitch[numTenants]: EthernetSwitch {
            @display("p=200+i*400,450");
        }

        // Tenant Hosts
        host[numTenants*hostsPerTenant]: StandardHost {
            @display("p=100+floor(i/hostsPerTenant)*400+50*(i%hostsPerTenant),650");
        }

    connections allowunconnected:
        // Connect controller to core switches
        controller.ethg++ <--> {datarate=1Gbps; delay=1ms;} <--> coreSwitch1.ethg++;
        controller.ethg++ <--> {datarate=1Gbps; delay=1ms;} <--> coreSwitch2.ethg++;

        // Connect core switches to each other
        coreSwitch1.ethg++ <--> {datarate=10Gbps; delay=0.5ms;} <--> coreSwitch2.ethg++;

        // Connect edge switches to core switches
        for i=0..numTenants-1 {
            edgeSwitch[i].ethg++ <--> {datarate=1Gbps; delay=1ms;} <--> coreSwitch1.ethg++;
            edgeSwitch[i].ethg++ <--> {datarate=1Gbps; delay=1ms;} <--> coreSwitch2.ethg++;
        }

        // Connect hosts to edge switches
        for i=0..numTenants*hostsPerTenant-1 {
            host[i].ethg++ <--> {datarate=100Mbps; delay=0.1ms;} <--> edgeSwitch[floor(i/hostsPerTenant)].ethg++;
        }
}
```

### Task 1.2: Create OMNeT++ Configuration File

**File: `sdn_dashboard/simulations/omnetpp.ini`**

```ini
[General]
network = sdn_dashboard.simulations.networks.CloudTopology
sim-time-limit = 1000s
cmdenv-express-mode = true
cmdenv-autoflush = true

# Visualization
*.visualizer.*.interfaceTableVisualizer.displayInterfaceTables = true
*.visualizer.*.routingTableVisualizer.displayRoutingTables = true

# Network Configuration
*.configurator.config = xml("<config><interface hosts='**' address='10.x.x.x' netmask='255.255.255.0'/></config>")

# Tenant Configuration
*.numTenants = 3
*.hostsPerTenant = 4

# Host Applications (traffic generation)
*.host[*].numApps = 1
*.host[*].app[0].typename = "UdpBasicApp"
*.host[*].app[0].destAddresses = "host[" + string(uniform(0,11)) + "]"
*.host[*].app[0].destPort = 5000
*.host[*].app[0].messageLength = 1000B
*.host[*].app[0].sendInterval = exponential(1s)
*.host[*].app[0].startTime = uniform(0s, 10s)

# UDP application on all hosts
*.host[*].numApps = 2
*.host[*].app[1].typename = "UdpSink"
*.host[*].app[1].localPort = 5000

# Ethernet Settings
**.eth[*].queueType = "DropTailQueue"
**.eth[*].queue.frameCapacity = 100

# Recording
**.result-recording-mode = all
```

### Task 1.3: Create Package Definition

**File: `sdn_dashboard/simulations/package.ned`**

```ned
package sdn_dashboard.simulations;
```

**File: `sdn_dashboard/simulations/networks/package.ned`**

```ned
package sdn_dashboard.simulations.networks;
```

### Task 1.4: Test Basic Simulation

```bash
cd sdn_dashboard/simulations

# Generate Makefile
opp_makemake -f --deep -o sdn_sim -I../../inet/src -L../../inet/src -lINET

# Build
make MODE=release

# Run simulation
./sdn_sim -u Cmdenv -c General -n ../../inet/src:.:../src

# If successful, you should see network initialization and packets being sent
```

**Validation Checklist for Phase 1:**

- [ ] Topology file compiles without errors
- [ ] Simulation runs and shows network initialization
- [ ] Hosts can send/receive packets
- [ ] Topology visualization displays correctly in OMNeT++ GUI
- [ ] No error messages about missing modules

---

## Phase 2: Basic Cloud Topology Creation

### Task 2.1: Enhanced Topology with Slice Support

**File: `sdn_dashboard/simulations/networks/SliceableCloudTopology.ned`**

```ned
package sdn_dashboard.simulations.networks;

import inet.networklayer.configurator.ipv4.Ipv4NetworkConfigurator;
import inet.node.ethernet.EthernetSwitch;
import inet.node.inet.StandardHost;
import inet.visualizer.integrated.IntegratedCanvasVisualizer;
import inet.linklayer.vlan.VlanInterface;

network SliceableCloudTopology
{
    parameters:
        int numSlices = default(3);
        int hostsPerSlice = default(4);
        @display("bgb=1400,900");

    types:
        // Custom host type with VLAN support
        module SliceHost extends StandardHost {
            parameters:
                @display("i=device/pc");
            gates:
                // Additional properties for slice membership
        }

        // Custom switch with OpenFlow support placeholder
        module SDNSwitch extends EthernetSwitch {
            parameters:
                @display("i=device/switch");
                int sliceCapability = default(1);  // Can support slicing
        }

    submodules:
        configurator: Ipv4NetworkConfigurator {
            @display("p=100,50");
        }

        visualizer: IntegratedCanvasVisualizer {
            @display("p=100,150");
        }

        // SDN Controller with enhanced capabilities
        controller: StandardHost {
            @display("p=700,50;i=device/server_l");
        }

        // Core layer - 2 switches for redundancy
        coreSwitch1: SDNSwitch {
            @display("p=500,250");
        }

        coreSwitch2: SDNSwitch {
            @display("p=900,250");
        }

        // Aggregation layer - 3 switches
        aggSwitch[3]: SDNSwitch {
            @display("p=300+i*400,450");
        }

        // Edge switches - one per slice
        edgeSwitch[numSlices]: SDNSwitch {
            @display("p=200+i*350,650");
        }

        // Hosts organized by slice
        host[numSlices*hostsPerSlice]: SliceHost {
            @display("p=100+floor(i/hostsPerSlice)*350+60*(i%hostsPerSlice),800");
        }

    connections:
        // Controller connections to core
        controller.ethg++ <--> {datarate=1Gbps; delay=0.5ms;} <--> coreSwitch1.ethg++;
        controller.ethg++ <--> {datarate=1Gbps; delay=0.5ms;} <--> coreSwitch2.ethg++;

        // Core layer full mesh
        coreSwitch1.ethg++ <--> {datarate=40Gbps; delay=0.2ms;} <--> coreSwitch2.ethg++;

        // Core to Aggregation (all-to-all for redundancy)
        for i=0..2 {
            coreSwitch1.ethg++ <--> {datarate=10Gbps; delay=0.5ms;} <--> aggSwitch[i].ethg++;
            coreSwitch2.ethg++ <--> {datarate=10Gbps; delay=0.5ms;} <--> aggSwitch[i].ethg++;
        }

        // Aggregation to Edge
        for i=0..numSlices-1 {
            aggSwitch[i%3].ethg++ <--> {datarate=1Gbps; delay=1ms;} <--> edgeSwitch[i].ethg++;
            aggSwitch[(i+1)%3].ethg++ <--> {datarate=1Gbps; delay=1ms;} <--> edgeSwitch[i].ethg++;
        }

        // Edge to Hosts
        for i=0..numSlices*hostsPerSlice-1 {
            host[i].ethg++ <--> {datarate=1Gbps; delay=0.1ms;} <--> edgeSwitch[floor(i/hostsPerSlice)].ethg++;
        }
}
```

### Task 2.2: Create Configuration for Slicing

**File: `sdn_dashboard/simulations/slicing.ini`**

```ini
[General]
network = sdn_dashboard.simulations.networks.SliceableCloudTopology
sim-time-limit = 1000s
cmdenv-express-mode = true

# Slicing configuration
*.numSlices = 3
*.hostsPerSlice = 4

# Network configuration with slice-aware addressing
*.configurator.config = xmldoc("network-config.xml")

# Slice 0: Tenant A (VLAN 10) - 10.0.10.x
*.host[0..3].numApps = 1
*.host[0..3].app[0].typename = "PingApp"
*.host[0..3].app[0].destAddr = "host[" + string(uniform(0,3)) + "]"
*.host[0..3].app[0].startTime = uniform(1s, 5s)
*.host[0..3].app[0].sendInterval = 1s

# Slice 1: Tenant B (VLAN 20) - 10.0.20.x
*.host[4..7].numApps = 1
*.host[4..7].app[0].typename = "PingApp"
*.host[4..7].app[0].destAddr = "host[" + string(uniform(4,7)) + "]"
*.host[4..7].app[0].startTime = uniform(1s, 5s)
*.host[4..7].app[0].sendInterval = 1s

# Slice 2: Tenant C (VLAN 30) - 10.0.30.x
*.host[8..11].numApps = 1
*.host[8..11].app[0].typename = "PingApp"
*.host[8..11].app[0].destAddr = "host[" + string(uniform(8,11)) + "]"
*.host[8..11].app[0].startTime = uniform(1s, 5s)
*.host[8..11].app[0].sendInterval = 1s

# Statistics recording
**.scalar-recording = true
**.vector-recording = true
```

### Task 2.3: Network Configuration XML

**File: `sdn_dashboard/simulations/network-config.xml`**

```xml
<config>
    <!-- Slice 0: VLAN 10 -->
    <interface hosts="host[0]" address="10.0.10.1" netmask="255.255.255.0"/>
    <interface hosts="host[1]" address="10.0.10.2" netmask="255.255.255.0"/>
    <interface hosts="host[2]" address="10.0.10.3" netmask="255.255.255.0"/>
    <interface hosts="host[3]" address="10.0.10.4" netmask="255.255.255.0"/>

    <!-- Slice 1: VLAN 20 -->
    <interface hosts="host[4]" address="10.0.20.1" netmask="255.255.255.0"/>
    <interface hosts="host[5]" address="10.0.20.2" netmask="255.255.255.0"/>
    <interface hosts="host[6]" address="10.0.20.3" netmask="255.255.255.0"/>
    <interface hosts="host[7]" address="10.0.20.4" netmask="255.255.255.0"/>

    <!-- Slice 2: VLAN 30 -->
    <interface hosts="host[8]" address="10.0.30.1" netmask="255.255.255.0"/>
    <interface hosts="host[9]" address="10.0.30.2" netmask="255.255.255.0"/>
    <interface hosts="host[10]" address="10.0.30.3" netmask="255.255.255.0"/>
    <interface hosts="host[11]" address="10.0.30.4" netmask="255.255.255.0"/>

    <!-- Controller -->
    <interface hosts="controller" address="10.0.0.1" netmask="255.255.0.0"/>

    <!-- Routing -->
    <route hosts="host[*]" destination="*" gateway="controller"/>
</config>
```

**Validation Checklist for Phase 2:**

- [ ] Enhanced topology compiles successfully
- [ ] Three slices are created with distinct VLANs
- [ ] Hosts in same slice can communicate
- [ ] Hosts in different slices are isolated (initially)
- [ ] Topology visualization shows all switches and hosts

---

## Phase 3: SDN Controller Implementation

### Task 3.1: Create Basic SDN Controller Module

**File: `sdn_dashboard/src/controller/SDNController.ned`**

```ned
package sdn_dashboard.src.controller;

import inet.node.inet.StandardHost;
import inet.applications.contract.IApp;

simple SDNControllerApp like IApp
{
    parameters:
        int localPort = default(6653);  // OpenFlow default port
        string sliceConfigFile = default("slices.json");
        string flowConfigFile = default("flows.json");
        volatile double processingDelay @unit(s) = default(uniform(0.001s, 0.005s));

        @display("i=block/control");
        @signal[flowInstalled](type=long);
        @signal[sliceCreated](type=long);
        @signal[flowRemoved](type=long);
        @statistic[numFlows](source=flowInstalled; record=count,vector);
        @statistic[numSlices](source=sliceCreated; record=count,vector);

    gates:
        input socketIn;
        output socketOut;
}
```

**File: `sdn_dashboard/src/controller/SDNController.h`**

```cpp
#ifndef __SDN_DASHBOARD_SDNCONTROLLER_H
#define __SDN_DASHBOARD_SDNCONTROLLER_H

#include <omnetpp.h>
#include <inet/common/INETDefs.h>
#include <inet/applications/base/ApplicationBase.h>
#include <inet/transportlayer/contract/udp/UdpSocket.h>
#include <map>
#include <vector>
#include <string>

using namespace omnetpp;
using namespace inet;

namespace sdn_dashboard {

// Data structures
struct FlowRule {
    int flowId;
    std::string srcIP;
    std::string dstIP;
    int srcPort;
    int dstPort;
    std::string action;  // "forward", "drop", "modify"
    int outputPort;
    int priority;
    int sliceId;
    simtime_t installedTime;
    long packetsMatched;
    long bytesMatched;
};

struct NetworkSlice {
    int sliceId;
    std::string name;
    int vlanId;
    std::vector<std::string> hostIPs;
    double bandwidthMbps;
    bool isolated;
    std::vector<int> flowRuleIds;
    simtime_t createdTime;
};

class SDNControllerApp : public ApplicationBase
{
  protected:
    // Configuration
    int localPort;
    std::string sliceConfigFile;
    std::string flowConfigFile;

    // State
    std::map<int, FlowRule> flowTable;
    std::map<int, NetworkSlice> slices;
    int nextFlowId;
    int nextSliceId;

    // Socket
    UdpSocket socket;

    // Signals
    simsignal_t flowInstalledSignal;
    simsignal_t sliceCreatedSignal;
    simsignal_t flowRemovedSignal;

    // File descriptors for external communication
    std::ofstream *stateFile;

  protected:
    virtual int numInitStages() const override { return NUM_INIT_STAGES; }
    virtual void initialize(int stage) override;
    virtual void handleMessageWhenUp(cMessage *msg) override;
    virtual void finish() override;

    // Lifecycle
    virtual void handleStartOperation(LifecycleOperation *operation) override;
    virtual void handleStopOperation(LifecycleOperation *operation) override;
    virtual void handleCrashOperation(LifecycleOperation *operation) override;

    // Core functionality
    virtual void processPacket(Packet *packet);
    virtual void installFlowRule(const FlowRule &rule);
    virtual void removeFlowRule(int flowId);
    virtual void createSlice(const NetworkSlice &slice);
    virtual void deleteSlice(int sliceId);
    virtual void updateSlice(const NetworkSlice &slice);

    // External interface
    virtual void loadConfiguration();
    virtual void saveState();
    virtual void exportTopology();

  public:
    SDNControllerApp();
    virtual ~SDNControllerApp();

    // API for external access
    const std::map<int, FlowRule>& getFlowTable() const { return flowTable; }
    const std::map<int, NetworkSlice>& getSlices() const { return slices; }
    int addFlow(const FlowRule &rule);
    bool removeFlow(int flowId);
    int addSlice(const NetworkSlice &slice);
    bool removeSlice(int sliceId);
};

} // namespace sdn_dashboard

#endif
```

**File: `sdn_dashboard/src/controller/SDNController.cc`**

```cpp
#include "SDNController.h"
#include <inet/common/ModuleAccess.h>
#include <inet/common/packet/Packet.h>
#include <inet/networklayer/ipv4/Ipv4Header_m.h>
#include <fstream>
#include <iostream>

namespace sdn_dashboard {

Define_Module(SDNControllerApp);

SDNControllerApp::SDNControllerApp()
{
    nextFlowId = 1;
    nextSliceId = 1;
    stateFile = nullptr;
}

SDNControllerApp::~SDNControllerApp()
{
    if (stateFile) {
        stateFile->close();
        delete stateFile;
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

        // Export initial state
        saveState();
        exportTopology();
    }
}

void SDNControllerApp::handleMessageWhenUp(cMessage *msg)
{
    if (socket.belongsToSocket(msg)) {
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
        rule.action = "forward";
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

} // namespace sdn_dashboard
```

### Task 3.2: Integrate Controller into Topology

Update `SliceableCloudTopology.ned` to use the custom controller:

```ned
// In the controller submodule:
controller: StandardHost {
    @display("p=700,50;i=device/server_l");
    numApps = 1;
    app[0].typename = "SDNControllerApp";
}
```

### Task 3.3: Build Controller Module

```bash
cd sdn_dashboard/src

# Create Makefile
opp_makemake -f --deep -o sdn_controller -I../../../inet/src -L../../../inet/src -lINET

# Build
make MODE=release
```

**Validation Checklist for Phase 3:**

- [ ] Controller module compiles without errors
- [ ] Controller initializes and loads default slices
- [ ] State file (`controller_state.json`) is created
- [ ] Topology file is exported
- [ ] Flow rules are installed for each slice
- [ ] Statistics are recorded

---

## Phase 4: Dashboard Backend Development

### Task 4.1: Initialize Backend Project

```bash
cd sdn_dashboard/dashboard/backend

# Already initialized in Phase setup, now create files
```

### Task 4.2: Create Express Server

**File: `sdn_dashboard/dashboard/backend/server.js`**

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Path to OMNeT++ simulation results
const RESULTS_DIR = path.join(__dirname, '../../../simulations/results');
const STATE_FILE = path.join(RESULTS_DIR, 'controller_state.json');
const TOPOLOGY_FILE = path.join(RESULTS_DIR, 'topology.json');

// In-memory cache
let currentState = {
    slices: [],
    flows: [],
    timestamp: 0
};

let topology = {
    nodes: [],
    links: []
};

// Load initial data
function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = fs.readFileSync(STATE_FILE, 'utf8');
            currentState = JSON.parse(data);
            console.log('Loaded state:', currentState);
        }
    } catch (err) {
        console.error('Error loading state:', err);
    }
}

function loadTopology() {
    try {
        if (fs.existsSync(TOPOLOGY_FILE)) {
            const data = fs.readFileSync(TOPOLOGY_FILE, 'utf8');
            topology = JSON.parse(data);
            console.log('Loaded topology');
        }
    } catch (err) {
        console.error('Error loading topology:', err);
    }
}

// Watch for file changes
fs.watch(RESULTS_DIR, (eventType, filename) => {
    if (filename === 'controller_state.json') {
        console.log('State file changed, reloading...');
        setTimeout(loadState, 100);  // Small delay to ensure write is complete
        broadcastUpdate();
    }
});

// REST API Endpoints

// Get topology
app.get('/api/topology', (req, res) => {
    res.json(topology);
});

// Get all slices
app.get('/api/slices', (req, res) => {
    res.json(currentState.slices || []);
});

// Get specific slice
app.get('/api/slices/:id', (req, res) => {
    const sliceId = parseInt(req.params.id);
    const slice = currentState.slices.find(s => s.id === sliceId);

    if (slice) {
        res.json(slice);
    } else {
        res.status(404).json({ error: 'Slice not found' });
    }
});

// Create new slice
app.post('/api/slices', (req, res) => {
    const { name, vlanId, bandwidth, hosts, isolated } = req.body;

    // Validate input
    if (!name || !vlanId || !bandwidth || !hosts) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create slice object
    const newSlice = {
        id: currentState.slices.length + 1,
        name,
        vlanId,
        bandwidth,
        hosts,
        isolated: isolated !== undefined ? isolated : true
    };

    // TODO: Send to OMNeT++ controller via command interface
    // For now, add to local state
    currentState.slices.push(newSlice);

    // Write command file for OMNeT++ to pick up
    const command = {
        type: 'CREATE_SLICE',
        data: newSlice,
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command)
    );

    res.status(201).json(newSlice);
});

// Update slice
app.put('/api/slices/:id', (req, res) => {
    const sliceId = parseInt(req.params.id);
    const sliceIndex = currentState.slices.findIndex(s => s.id === sliceId);

    if (sliceIndex === -1) {
        return res.status(404).json({ error: 'Slice not found' });
    }

    // Update slice
    currentState.slices[sliceIndex] = {
        ...currentState.slices[sliceIndex],
        ...req.body,
        id: sliceId  // Ensure ID doesn't change
    };

    // Send update command to OMNeT++
    const command = {
        type: 'UPDATE_SLICE',
        data: currentState.slices[sliceIndex],
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command)
    );

    res.json(currentState.slices[sliceIndex]);
});

// Delete slice
app.delete('/api/slices/:id', (req, res) => {
    const sliceId = parseInt(req.params.id);
    const sliceIndex = currentState.slices.findIndex(s => s.id === sliceId);

    if (sliceIndex === -1) {
        return res.status(404).json({ error: 'Slice not found' });
    }

    // Remove slice
    const deletedSlice = currentState.slices.splice(sliceIndex, 1)[0];

    // Send delete command to OMNeT++
    const command = {
        type: 'DELETE_SLICE',
        data: { id: sliceId },
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command)
    );

    res.json(deletedSlice);
});

// Get all flows
app.get('/api/flows', (req, res) => {
    const sliceId = req.query.sliceId;

    let flows = currentState.flows || [];

    if (sliceId) {
        flows = flows.filter(f => f.sliceId === parseInt(sliceId));
    }

    res.json(flows);
});

// Get specific flow
app.get('/api/flows/:id', (req, res) => {
    const flowId = parseInt(req.params.id);
    const flow = currentState.flows.find(f => f.id === flowId);

    if (flow) {
        res.json(flow);
    } else {
        res.status(404).json({ error: 'Flow not found' });
    }
});

// Create new flow
app.post('/api/flows', (req, res) => {
    const { srcIP, dstIP, action, priority, sliceId } = req.body;

    if (!srcIP || !dstIP || !action) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newFlow = {
        id: currentState.flows.length + 1,
        srcIP,
        dstIP,
        action,
        priority: priority || 100,
        sliceId: sliceId || 0,
        packets: 0,
        bytes: 0
    };

    currentState.flows.push(newFlow);

    // Send command to OMNeT++
    const command = {
        type: 'ADD_FLOW',
        data: newFlow,
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command)
    );

    res.status(201).json(newFlow);
});

// Delete flow
app.delete('/api/flows/:id', (req, res) => {
    const flowId = parseInt(req.params.id);
    const flowIndex = currentState.flows.findIndex(f => f.id === flowId);

    if (flowIndex === -1) {
        return res.status(404).json({ error: 'Flow not found' });
    }

    const deletedFlow = currentState.flows.splice(flowIndex, 1)[0];

    // Send command to OMNeT++
    const command = {
        type: 'DELETE_FLOW',
        data: { id: flowId },
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command)
    );

    res.json(deletedFlow);
});

// Get statistics
app.get('/api/statistics', (req, res) => {
    const stats = {
        totalSlices: currentState.slices.length,
        totalFlows: currentState.flows.length,
        totalHosts: topology.nodes.filter(n => n.type === 'host').length,
        totalSwitches: topology.nodes.filter(n => n.type === 'switch').length,
        timestamp: currentState.timestamp
    };

    res.json(stats);
});

// WebSocket for real-time updates
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    // Send initial state
    ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        data: currentState
    }));

    ws.on('message', (message) => {
        console.log('Received:', message);
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

function broadcastUpdate() {
    const message = JSON.stringify({
        type: 'STATE_UPDATE',
        data: currentState
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Start server
const server = app.listen(PORT, () => {
    console.log(`Dashboard backend running on port ${PORT}`);
    loadState();
    loadTopology();
});

// Upgrade HTTP server to handle WebSocket
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
    });
});
```

### Task 4.3: Create Package.json

**File: `sdn_dashboard/dashboard/backend/package.json`**

```json
{
  "name": "sdn-dashboard-backend",
  "version": "1.0.0",
  "description": "Backend API for SDN Dashboard",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": ["sdn", "omnet", "dashboard"],
  "author": "Justin and Taran",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Task 4.4: Test Backend

```bash
cd sdn_dashboard/dashboard/backend

# Install dependencies
npm install

# Start server
npm start

# In another terminal, test API
curl http://localhost:3001/api/slices
curl http://localhost:3001/api/flows
curl http://localhost:3001/api/topology
```

**Validation Checklist for Phase 4:**

- [ ] Backend server starts without errors
- [ ] API endpoints respond correctly
- [ ] State file is loaded successfully
- [ ] WebSocket connection can be established
- [ ] File watcher detects changes to state file
- [ ] Commands can be written to command file

---

## Phase 5: Dashboard Frontend Development

### Task 5.1: Create React Components

**File: `sdn_dashboard/dashboard/frontend/src/App.js`**

```javascript
import React, { useState, useEffect } from 'react';
import './App.css';
import TopologyView from './components/TopologyView';
import SlicePanel from './components/SlicePanel';
import FlowPanel from './components/FlowPanel';
import Statistics from './components/Statistics';
import api from './services/api';

function App() {
  const [slices, setSlices] = useState([]);
  const [flows, setFlows] = useState([]);
  const [topology, setTopology] = useState({ nodes: [], links: [] });
  const [statistics, setStatistics] = useState({});
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [ws, setWs] = useState(null);

  // Load initial data
  useEffect(() => {
    loadData();

    // Setup WebSocket
    const websocket = new WebSocket('ws://localhost:3001');

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'INITIAL_STATE' || message.type === 'STATE_UPDATE') {
        setSlices(message.data.slices || []);
        setFlows(message.data.flows || []);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const loadData = async () => {
    try {
      const [slicesData, flowsData, topoData, statsData] = await Promise.all([
        api.getSlices(),
        api.getFlows(),
        api.getTopology(),
        api.getStatistics()
      ]);

      setSlices(slicesData);
      setFlows(flowsData);
      setTopology(topoData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateSlice = async (sliceData) => {
    try {
      const newSlice = await api.createSlice(sliceData);
      setSlices([...slices, newSlice]);
    } catch (error) {
      console.error('Error creating slice:', error);
    }
  };

  const handleDeleteSlice = async (sliceId) => {
    try {
      await api.deleteSlice(sliceId);
      setSlices(slices.filter(s => s.id !== sliceId));

      // Remove flows associated with this slice
      setFlows(flows.filter(f => f.sliceId !== sliceId));
    } catch (error) {
      console.error('Error deleting slice:', error);
    }
  };

  const handleUpdateSlice = async (sliceId, updates) => {
    try {
      const updatedSlice = await api.updateSlice(sliceId, updates);
      setSlices(slices.map(s => s.id === sliceId ? updatedSlice : s));
    } catch (error) {
      console.error('Error updating slice:', error);
    }
  };

  const handleAddFlow = async (flowData) => {
    try {
      const newFlow = await api.addFlow(flowData);
      setFlows([...flows, newFlow]);
    } catch (error) {
      console.error('Error adding flow:', error);
    }
  };

  const handleDeleteFlow = async (flowId) => {
    try {
      await api.deleteFlow(flowId);
      setFlows(flows.filter(f => f.id !== flowId));
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Cloud-Based SDN Management Dashboard</h1>
        <Statistics data={statistics} />
      </header>

      <div className="main-content">
        <div className="topology-section">
          <TopologyView
            topology={topology}
            slices={slices}
            selectedSlice={selectedSlice}
          />
        </div>

        <div className="control-panels">
          <SlicePanel
            slices={slices}
            onCreateSlice={handleCreateSlice}
            onDeleteSlice={handleDeleteSlice}
            onUpdateSlice={handleUpdateSlice}
            onSelectSlice={setSelectedSlice}
            selectedSlice={selectedSlice}
          />

          <FlowPanel
            flows={flows}
            slices={slices}
            selectedSlice={selectedSlice}
            onAddFlow={handleAddFlow}
            onDeleteFlow={handleDeleteFlow}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
```

### Task 5.2: Create API Service

**File: `sdn_dashboard/dashboard/frontend/src/services/api.js`**

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = {
  // Topology
  getTopology: async () => {
    const response = await axios.get(`${API_BASE_URL}/topology`);
    return response.data;
  },

  // Slices
  getSlices: async () => {
    const response = await axios.get(`${API_BASE_URL}/slices`);
    return response.data;
  },

  getSlice: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/slices/${id}`);
    return response.data;
  },

  createSlice: async (sliceData) => {
    const response = await axios.post(`${API_BASE_URL}/slices`, sliceData);
    return response.data;
  },

  updateSlice: async (id, updates) => {
    const response = await axios.put(`${API_BASE_URL}/slices/${id}`, updates);
    return response.data;
  },

  deleteSlice: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/slices/${id}`);
    return response.data;
  },

  // Flows
  getFlows: async (sliceId = null) => {
    const url = sliceId
      ? `${API_BASE_URL}/flows?sliceId=${sliceId}`
      : `${API_BASE_URL}/flows`;
    const response = await axios.get(url);
    return response.data;
  },

  getFlow: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/flows/${id}`);
    return response.data;
  },

  addFlow: async (flowData) => {
    const response = await axios.post(`${API_BASE_URL}/flows`, flowData);
    return response.data;
  },

  deleteFlow: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/flows/${id}`);
    return response.data;
  },

  // Statistics
  getStatistics: async () => {
    const response = await axios.get(`${API_BASE_URL}/statistics`);
    return response.data;
  }
};

export default api;
```

### Task 5.3: Create Slice Panel Component

**File: `sdn_dashboard/dashboard/frontend/src/components/SlicePanel.js`**

```javascript
import React, { useState } from 'react';
import './SlicePanel.css';

function SlicePanel({ slices, onCreateSlice, onDeleteSlice, onUpdateSlice, onSelectSlice, selectedSlice }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSlice, setNewSlice] = useState({
    name: '',
    vlanId: '',
    bandwidth: '',
    hosts: [],
    isolated: true
  });

  const handleCreate = () => {
    onCreateSlice(newSlice);
    setNewSlice({ name: '', vlanId: '', bandwidth: '', hosts: [], isolated: true });
    setShowCreateForm(false);
  };

  const handleHostsChange = (e) => {
    const hostsArray = e.target.value.split(',').map(h => h.trim()).filter(h => h);
    setNewSlice({ ...newSlice, hosts: hostsArray });
  };

  return (
    <div className="slice-panel">
      <h2>Network Slices</h2>

      <button
        className="create-btn"
        onClick={() => setShowCreateForm(!showCreateForm)}
      >
        {showCreateForm ? 'Cancel' : '+ Create Slice'}
      </button>

      {showCreateForm && (
        <div className="create-form">
          <h3>New Slice</h3>
          <input
            type="text"
            placeholder="Slice Name"
            value={newSlice.name}
            onChange={(e) => setNewSlice({ ...newSlice, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="VLAN ID"
            value={newSlice.vlanId}
            onChange={(e) => setNewSlice({ ...newSlice, vlanId: parseInt(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Bandwidth (Mbps)"
            value={newSlice.bandwidth}
            onChange={(e) => setNewSlice({ ...newSlice, bandwidth: parseFloat(e.target.value) })}
          />
          <input
            type="text"
            placeholder="Hosts (comma-separated IPs)"
            onChange={handleHostsChange}
          />
          <label>
            <input
              type="checkbox"
              checked={newSlice.isolated}
              onChange={(e) => setNewSlice({ ...newSlice, isolated: e.target.checked })}
            />
            Isolated
          </label>
          <button onClick={handleCreate}>Create</button>
        </div>
      )}

      <div className="slice-list">
        {slices.map(slice => (
          <div
            key={slice.id}
            className={`slice-item ${selectedSlice?.id === slice.id ? 'selected' : ''}`}
            onClick={() => onSelectSlice(slice)}
          >
            <div className="slice-header">
              <h3>{slice.name}</h3>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSlice(slice.id);
                }}
              >
                ×
              </button>
            </div>
            <div className="slice-details">
              <p><strong>VLAN:</strong> {slice.vlanId}</p>
              <p><strong>Bandwidth:</strong> {slice.bandwidth} Mbps</p>
              <p><strong>Hosts:</strong> {slice.hosts.length}</p>
              <p><strong>Isolated:</strong> {slice.isolated ? 'Yes' : 'No'}</p>
            </div>
            {selectedSlice?.id === slice.id && (
              <div className="slice-hosts">
                <h4>Hosts:</h4>
                <ul>
                  {slice.hosts.map((host, idx) => (
                    <li key={idx}>{host}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SlicePanel;
```

### Task 5.4: Create Flow Panel Component

**File: `sdn_dashboard/dashboard/frontend/src/components/FlowPanel.js`**

```javascript
import React, { useState } from 'react';
import './FlowPanel.css';

function FlowPanel({ flows, slices, selectedSlice, onAddFlow, onDeleteFlow }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFlow, setNewFlow] = useState({
    srcIP: '',
    dstIP: '',
    action: 'forward',
    priority: 100,
    sliceId: selectedSlice?.id || 0
  });

  const filteredFlows = selectedSlice
    ? flows.filter(f => f.sliceId === selectedSlice.id)
    : flows;

  const handleAdd = () => {
    onAddFlow({
      ...newFlow,
      sliceId: selectedSlice?.id || 0
    });
    setNewFlow({ srcIP: '', dstIP: '', action: 'forward', priority: 100, sliceId: 0 });
    setShowAddForm(false);
  };

  return (
    <div className="flow-panel">
      <h2>Flow Rules</h2>

      {selectedSlice && (
        <div className="slice-context">
          <p>Slice: <strong>{selectedSlice.name}</strong></p>
        </div>
      )}

      <button
        className="add-btn"
        onClick={() => setShowAddForm(!showAddForm)}
        disabled={!selectedSlice}
      >
        {showAddForm ? 'Cancel' : '+ Add Flow'}
      </button>

      {showAddForm && (
        <div className="add-form">
          <h3>New Flow Rule</h3>
          <input
            type="text"
            placeholder="Source IP"
            value={newFlow.srcIP}
            onChange={(e) => setNewFlow({ ...newFlow, srcIP: e.target.value })}
          />
          <input
            type="text"
            placeholder="Destination IP"
            value={newFlow.dstIP}
            onChange={(e) => setNewFlow({ ...newFlow, dstIP: e.target.value })}
          />
          <select
            value={newFlow.action}
            onChange={(e) => setNewFlow({ ...newFlow, action: e.target.value })}
          >
            <option value="forward">Forward</option>
            <option value="drop">Drop</option>
            <option value="modify">Modify</option>
          </select>
          <input
            type="number"
            placeholder="Priority"
            value={newFlow.priority}
            onChange={(e) => setNewFlow({ ...newFlow, priority: parseInt(e.target.value) })}
          />
          <button onClick={handleAdd}>Add Flow</button>
        </div>
      )}

      <div className="flow-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Source IP</th>
              <th>Dest IP</th>
              <th>Action</th>
              <th>Priority</th>
              <th>Packets</th>
              <th>Bytes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlows.map(flow => (
              <tr key={flow.id}>
                <td>{flow.id}</td>
                <td>{flow.srcIP}</td>
                <td>{flow.dstIP}</td>
                <td>{flow.action}</td>
                <td>{flow.priority}</td>
                <td>{flow.packets || 0}</td>
                <td>{flow.bytes || 0}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => onDeleteFlow(flow.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFlows.length === 0 && (
          <p className="no-flows">No flow rules found</p>
        )}
      </div>
    </div>
  );
}

export default FlowPanel;
```

### Task 5.5: Create Topology Visualization

**File: `sdn_dashboard/dashboard/frontend/src/components/TopologyView.js`**

```javascript
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './TopologyView.css';

function TopologyView({ topology, slices, selectedSlice }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!topology.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;

    svg.attr('width', width).attr('height', height);

    // Create groups
    const g = svg.append('g');

    // Color scale for slices
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Position nodes by type
    const nodesByType = {};
    topology.nodes.forEach(node => {
      if (!nodesByType[node.type]) {
        nodesByType[node.type] = [];
      }
      nodesByType[node.type].push(node);
    });

    // Layout nodes
    const positions = {};

    // Controller at top
    if (nodesByType.controller) {
      nodesByType.controller.forEach((node, i) => {
        positions[node.id] = { x: width / 2, y: 50 };
      });
    }

    // Switches in middle
    if (nodesByType.switch) {
      const switchY = 200;
      nodesByType.switch.forEach((node, i) => {
        const spacing = width / (nodesByType.switch.length + 1);
        positions[node.id] = { x: spacing * (i + 1), y: switchY };
      });
    }

    // Hosts at bottom, grouped by slice
    if (nodesByType.host) {
      const hostY = 450;
      const hostsPerRow = 4;

      nodesByType.host.forEach((node, i) => {
        const sliceId = node.slice || 0;
        const sliceOffset = sliceId * 250;
        const posInSlice = i % hostsPerRow;

        positions[node.id] = {
          x: 100 + sliceOffset + posInSlice * 60,
          y: hostY + Math.floor(i / hostsPerRow) * 50
        };
      });
    }

    // Draw links (if available)
    if (topology.links) {
      g.selectAll('line')
        .data(topology.links)
        .enter()
        .append('line')
        .attr('x1', d => positions[d.source]?.x || 0)
        .attr('y1', d => positions[d.source]?.y || 0)
        .attr('x2', d => positions[d.target]?.x || 0)
        .attr('y2', d => positions[d.target]?.y || 0)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2);
    }

    // Draw nodes
    const nodes = g.selectAll('circle')
      .data(topology.nodes)
      .enter()
      .append('circle')
      .attr('cx', d => positions[d.id]?.x || 0)
      .attr('cy', d => positions[d.id]?.y || 0)
      .attr('r', d => {
        if (d.type === 'controller') return 20;
        if (d.type === 'switch') return 15;
        return 10;
      })
      .attr('fill', d => {
        if (d.type === 'controller') return '#ff6b6b';
        if (d.type === 'switch') return '#4ecdc4';
        if (d.slice !== undefined) {
          return selectedSlice?.id === d.slice
            ? colorScale(d.slice)
            : '#95a5a6';
        }
        return '#95a5a6';
      })
      .attr('stroke', d =>
        selectedSlice && d.slice === selectedSlice.id ? '#2c3e50' : '#fff'
      )
      .attr('stroke-width', d =>
        selectedSlice && d.slice === selectedSlice.id ? 3 : 1
      );

    // Add labels
    g.selectAll('text')
      .data(topology.nodes)
      .enter()
      .append('text')
      .attr('x', d => positions[d.id]?.x || 0)
      .attr('y', d => (positions[d.id]?.y || 0) + 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .text(d => d.id);

    // Add zoom
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

  }, [topology, slices, selectedSlice]);

  return (
    <div className="topology-view">
      <h2>Network Topology</h2>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default TopologyView;
```

### Task 5.6: Create Statistics Component

**File: `sdn_dashboard/dashboard/frontend/src/components/Statistics.js`**

```javascript
import React from 'react';
import './Statistics.css';

function Statistics({ data }) {
  return (
    <div className="statistics">
      <div className="stat-item">
        <span className="stat-label">Slices:</span>
        <span className="stat-value">{data.totalSlices || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Flows:</span>
        <span className="stat-value">{data.totalFlows || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Hosts:</span>
        <span className="stat-value">{data.totalHosts || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Switches:</span>
        <span className="stat-value">{data.totalSwitches || 0}</span>
      </div>
    </div>
  );
}

export default Statistics;
```

### Task 5.7: Add CSS Styling

**File: `sdn_dashboard/dashboard/frontend/src/App.css`**

```css
.App {
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
}

.App-header h1 {
  margin: 0 0 20px 0;
}

.main-content {
  display: flex;
  height: calc(100vh - 150px);
}

.topology-section {
  flex: 2;
  padding: 20px;
  background-color: #f5f5f5;
}

.control-panels {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

button {
  padding: 10px 20px;
  margin: 5px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.create-btn, .add-btn {
  background-color: #4CAF50;
  color: white;
}

.create-btn:hover, .add-btn:hover {
  background-color: #45a049;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover {
  background-color: #da190b;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

input, select {
  padding: 8px;
  margin: 5px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}
```

**File: `sdn_dashboard/dashboard/frontend/src/components/SlicePanel.css`**

```css
.slice-panel {
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.slice-panel h2 {
  margin-top: 0;
}

.create-form {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin: 10px 0;
}

.create-form h3 {
  margin-top: 0;
}

.slice-list {
  margin-top: 20px;
}

.slice-item {
  background-color: white;
  border: 2px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  margin: 10px 0;
  cursor: pointer;
  transition: all 0.3s;
}

.slice-item:hover {
  border-color: #4CAF50;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.slice-item.selected {
  border-color: #4CAF50;
  background-color: #f0f8f0;
}

.slice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slice-header h3 {
  margin: 0;
}

.slice-details {
  margin-top: 10px;
  font-size: 14px;
}

.slice-details p {
  margin: 5px 0;
  text-align: left;
}

.slice-hosts {
  margin-top: 10px;
  border-top: 1px solid #ddd;
  padding-top: 10px;
}

.slice-hosts h4 {
  margin: 5px 0;
  text-align: left;
}

.slice-hosts ul {
  list-style: none;
  padding: 0;
  text-align: left;
}

.slice-hosts li {
  padding: 5px 0;
  font-family: monospace;
}
```

**File: `sdn_dashboard/dashboard/frontend/src/components/FlowPanel.css`**

```css
.flow-panel {
  padding: 20px;
}

.flow-panel h2 {
  margin-top: 0;
}

.slice-context {
  background-color: #e3f2fd;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
}

.add-form {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin: 10px 0;
}

.add-form h3 {
  margin-top: 0;
}

.flow-list {
  margin-top: 20px;
}

.flow-list table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.flow-list th {
  background-color: #4CAF50;
  color: white;
  padding: 12px;
  text-align: left;
  font-size: 12px;
}

.flow-list td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  font-size: 12px;
}

.flow-list tr:hover {
  background-color: #f5f5f5;
}

.no-flows {
  text-align: center;
  color: #999;
  padding: 20px;
}
```

**File: `sdn_dashboard/dashboard/frontend/src/components/TopologyView.css`**

```css
.topology-view {
  height: 100%;
}

.topology-view h2 {
  margin-top: 0;
}

.topology-view svg {
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 5px;
}
```

**File: `sdn_dashboard/dashboard/frontend/src/components/Statistics.css`**

```css
.statistics {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 14px;
  color: #ccc;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
}
```

### Task 5.8: Install Frontend Dependencies and Test

```bash
cd sdn_dashboard/dashboard/frontend

# Install dependencies
npm install axios d3

# Start development server
npm start

# Browser should open to http://localhost:3000
```

**Validation Checklist for Phase 5:**

- [ ] Frontend builds without errors
- [ ] Dashboard loads in browser
- [ ] Topology visualization displays
- [ ] Slice panel shows existing slices
- [ ] Flow panel displays flow rules
- [ ] Statistics are shown in header
- [ ] WebSocket connection is established
- [ ] Real-time updates work when state changes

---

## Phase 6: Integration and Testing

### Task 6.1: Create Command Processor in OMNeT++

The controller needs to read commands from the dashboard. Add this to `SDNController.cc`:

```cpp
// Add to SDNController.h
void processCommands();
std::string commandFile;
simtime_t lastCommandCheck;

// Add to initialize()
commandFile = "results/commands.json";
lastCommandCheck = simTime();

// Schedule periodic command checking
cMessage *checkCmd = new cMessage("checkCommands");
scheduleAt(simTime() + 1.0, checkCmd);

// Add to handleMessageWhenUp()
if (msg->isSelfMessage() && strcmp(msg->getName(), "checkCommands") == 0) {
    processCommands();
    scheduleAt(simTime() + 1.0, msg);  // Check again in 1 second
    return;
}

// Implement processCommands()
void SDNControllerApp::processCommands()
{
    if (!std::ifstream(commandFile).good()) return;

    std::ifstream file(commandFile);
    std::string content((std::istreambuf_iterator<char>(file)),
                        std::istreambuf_iterator<char>());
    file.close();

    if (content.empty()) return;

    // Parse JSON (simplified - in real implementation use proper JSON library)
    // For now, detect command type and process

    if (content.find("CREATE_SLICE") != std::string::npos) {
        // Parse and create slice
        EV << "Processing CREATE_SLICE command" << endl;
    }
    else if (content.find("DELETE_SLICE") != std::string::npos) {
        // Parse and delete slice
        EV << "Processing DELETE_SLICE command" << endl;
    }
    else if (content.find("ADD_FLOW") != std::string::npos) {
        // Parse and add flow
        EV << "Processing ADD_FLOW command" << endl;
    }
    else if (content.find("DELETE_FLOW") != std::string::npos) {
        // Parse and delete flow
        EV << "Processing DELETE_FLOW command" << endl;
    }

    // Clear command file after processing
    std::ofstream clearFile(commandFile, std::ios::trunc);
    clearFile.close();
}
```

### Task 6.2: Create Integration Test Script

**File: `sdn_dashboard/test_integration.sh`**

```bash
#!/bin/bash

echo "=== SDN Dashboard Integration Test ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check if OMNeT++ simulation can start
echo "Test 1: Starting OMNeT++ simulation..."
cd simulations
./sdn_sim -u Cmdenv -c General -n ../../../inet/src:.:../src &
SIM_PID=$!
sleep 5

if ps -p $SIM_PID > /dev/null; then
   echo -e "${GREEN}✓ Simulation started${NC}"
else
   echo -e "${RED}✗ Simulation failed to start${NC}"
   exit 1
fi

# Test 2: Check if state file is created
echo "Test 2: Checking state file..."
if [ -f "results/controller_state.json" ]; then
    echo -e "${GREEN}✓ State file created${NC}"
else
    echo -e "${RED}✗ State file not found${NC}"
    kill $SIM_PID
    exit 1
fi

# Test 3: Start backend
echo "Test 3: Starting backend server..."
cd ../dashboard/backend
npm start &
BACKEND_PID=$!
sleep 3

if ps -p $BACKEND_PID > /dev/null; then
   echo -e "${GREEN}✓ Backend started${NC}"
else
   echo -e "${RED}✗ Backend failed to start${NC}"
   kill $SIM_PID
   exit 1
fi

# Test 4: Test API endpoints
echo "Test 4: Testing API endpoints..."

# Test slices endpoint
SLICES=$(curl -s http://localhost:3001/api/slices)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Slices API working${NC}"
    echo "Slices: $SLICES"
else
    echo -e "${RED}✗ Slices API failed${NC}"
fi

# Test flows endpoint
FLOWS=$(curl -s http://localhost:3001/api/flows)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Flows API working${NC}"
else
    echo -e "${RED}✗ Flows API failed${NC}"
fi

# Test topology endpoint
TOPOLOGY=$(curl -s http://localhost:3001/api/topology)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Topology API working${NC}"
else
    echo -e "${RED}✗ Topology API failed${NC}"
fi

# Test 5: Test creating a slice
echo "Test 5: Creating test slice..."
CREATE_RESULT=$(curl -s -X POST http://localhost:3001/api/slices \
  -H "Content-Type: application/json" \
  -d '{"name":"TestSlice","vlanId":40,"bandwidth":100,"hosts":["10.0.40.1"],"isolated":true}')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Create slice API working${NC}"
    echo "Result: $CREATE_RESULT"
else
    echo -e "${RED}✗ Create slice API failed${NC}"
fi

# Test 6: Test creating a flow
echo "Test 6: Creating test flow..."
FLOW_RESULT=$(curl -s -X POST http://localhost:3001/api/flows \
  -H "Content-Type: application/json" \
  -d '{"srcIP":"10.0.10.1","dstIP":"10.0.10.2","action":"forward","priority":100,"sliceId":1}')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Create flow API working${NC}"
    echo "Result: $FLOW_RESULT"
else
    echo -e "${RED}✗ Create flow API failed${NC}"
fi

# Cleanup
echo ""
echo "Cleaning up..."
kill $SIM_PID
kill $BACKEND_PID

echo ""
echo "=== Integration Test Complete ==="
```

```bash
chmod +x test_integration.sh
```

### Task 6.3: Create End-to-End Test Scenarios

**File: `sdn_dashboard/test_scenarios.md`**

```markdown
# Test Scenarios for Milestone 1

## Scenario 1: Basic Slice Management

### Steps:
1. Start OMNeT++ simulation
2. Start dashboard backend and frontend
3. Verify 3 default slices are visible in dashboard
4. Create a new slice "TestSlice_A" with:
   - VLAN ID: 40
   - Bandwidth: 150 Mbps
   - Hosts: 10.0.40.1, 10.0.40.2
   - Isolated: Yes
5. Verify slice appears in slice list
6. Select the new slice
7. Verify slice is highlighted in topology view
8. Delete the slice
9. Verify slice is removed from list

### Expected Results:
- All slices visible in panel
- New slice created successfully
- Slice selection highlights hosts in topology
- Slice deletion removes all associated flows
- Real-time updates via WebSocket

## Scenario 2: Flow Rule Management

### Steps:
1. Select "Tenant_A" slice
2. View existing flows for this slice
3. Add new flow:
   - Source IP: 10.0.10.1
   - Dest IP: 10.0.10.2
   - Action: forward
   - Priority: 150
4. Verify flow appears in flow table
5. Check flow statistics (packets, bytes)
6. Delete the flow
7. Verify flow is removed

### Expected Results:
- Flows filtered by selected slice
- New flow added successfully
- Flow statistics update in real-time
- Flow deletion works correctly

## Scenario 3: Slice Isolation Testing

### Steps:
1. Start traffic generation in simulation
2. Select Tenant_A slice
3. Observe traffic statistics for hosts in Tenant_A
4. Select Tenant_B slice
5. Observe traffic statistics for hosts in Tenant_B
6. Verify no cross-slice traffic
7. Create a flow allowing cross-slice communication
8. Verify traffic now flows between slices

### Expected Results:
- Slices are isolated by default
- Traffic statistics show only intra-slice communication
- Manual flow rules can enable inter-slice communication

## Scenario 4: Real-Time Synchronization

### Steps:
1. Open dashboard in browser
2. Verify initial state loads
3. Create a slice via API (curl command)
4. Verify dashboard updates without refresh
5. Delete a flow via API
6. Verify dashboard removes flow without refresh

### Expected Results:
- WebSocket connection established
- Dashboard receives and displays updates in real-time
- No manual refresh required

## Scenario 5: Topology Visualization

### Steps:
1. View topology in dashboard
2. Verify all nodes are displayed:
   - 1 controller
   - 5 switches
   - 12 hosts
3. Verify nodes are positioned correctly by type
4. Select different slices
5. Verify corresponding hosts are highlighted
6. Use zoom and pan controls

### Expected Results:
- Topology displays all nodes
- Node colors reflect slice membership
- Selection highlighting works
- Zoom/pan interactions are smooth

## Performance Tests

### Test 1: Handle 10 Slices
- Create 10 slices
- Verify all display correctly
- Check for performance degradation

### Test 2: Handle 100 Flow Rules
- Create 100 flow rules across slices
- Verify all display in flow table
- Check table rendering performance

### Test 3: Rapid Updates
- Create/delete slices rapidly (10 operations)
- Verify dashboard stays synchronized
- Check for race conditions
```

### Task 6.4: Create README for Running the System

**File: `sdn_dashboard/README.md`**

```markdown
# SDN Dashboard - Running Instructions

## Prerequisites

- OMNeT++ 6.0+ installed
- INET Framework 4.5+ installed
- Node.js 18+ installed
- Modern web browser (Chrome, Firefox, Safari)

## Quick Start

### 1. Build the Simulation

```bash
cd sdn_dashboard/simulations
opp_makemake -f --deep -o sdn_sim -I../../../inet/src -L../../../inet/src -lINET
make MODE=release
```

### 2. Build the Controller Module

```bash
cd sdn_dashboard/src
opp_makemake -f --deep -o sdn_controller -I../../../inet/src -L../../../inet/src -lINET
make MODE=release
```

### 3. Start the OMNeT++ Simulation

```bash
cd sdn_dashboard/simulations
./sdn_sim -u Cmdenv -c General
```

Leave this running in a terminal.

### 4. Start the Backend Server

Open a new terminal:

```bash
cd sdn_dashboard/dashboard/backend
npm install  # First time only
npm start
```

Backend will run on http://localhost:3001

### 5. Start the Frontend Dashboard

Open another terminal:

```bash
cd sdn_dashboard/dashboard/frontend
npm install  # First time only
npm start
```

Browser will open to http://localhost:3000

## Usage

### Creating a Slice

1. Click "+ Create Slice" button
2. Enter slice details:
   - Name: e.g., "Production"
   - VLAN ID: e.g., 50
   - Bandwidth: e.g., 200 (Mbps)
   - Hosts: comma-separated IPs, e.g., "10.0.50.1,10.0.50.2"
   - Isolated: check for isolation
3. Click "Create"

### Adding Flow Rules

1. Select a slice from the list
2. Click "+ Add Flow" in Flow Panel
3. Enter flow details:
   - Source IP: e.g., "10.0.10.1"
   - Destination IP: e.g., "10.0.10.2"
   - Action: forward/drop/modify
   - Priority: e.g., 100 (higher = more important)
4. Click "Add Flow"

### Viewing Topology

- The topology view shows network layout
- Nodes are color-coded:
  - Red: Controller
  - Teal: Switches
  - Other colors: Hosts (by slice)
- Select a slice to highlight its hosts
- Use mouse wheel to zoom, drag to pan

## Troubleshooting

### Simulation won't start

- Check OMNeT++ installation: `omnetpp -v`
- Verify INET path in Makefile
- Check for compilation errors

### Backend won't connect to simulation

- Ensure simulation is running first
- Check that `results/controller_state.json` exists
- Verify file permissions

### Frontend shows no data

- Check backend is running (http://localhost:3001/api/slices)
- Check browser console for errors
- Verify WebSocket connection

### Changes don't reflect in dashboard

- Check WebSocket connection status
- Verify simulation is running
- Check backend terminal for file watch events

## Testing

Run integration tests:

```bash
cd sdn_dashboard
./test_integration.sh
```

## File Locations

- Simulation state: `sdn_dashboard/simulations/results/controller_state.json`
- Topology: `sdn_dashboard/simulations/results/topology.json`
- Commands: `sdn_dashboard/simulations/results/commands.json`
- Logs: `sdn_dashboard/simulations/results/*.log`

```

**Validation Checklist for Phase 6:**
- [ ] Integration test script runs successfully
- [ ] All API endpoints return correct data
- [ ] WebSocket connection works
- [ ] Dashboard displays simulation state
- [ ] Creating slices from dashboard works
- [ ] Adding flows from dashboard works
- [ ] Real-time updates are received
- [ ] All test scenarios pass

---

## Validation Checklist

### Overall System Validation

#### OMNeT++ Simulation Layer
- [ ] Topology compiles and runs
- [ ] 3 default slices are created (Tenant_A, Tenant_B, Tenant_C)
- [ ] Controller module initializes
- [ ] State file is generated and updated
- [ ] Topology file is exported
- [ ] Flow rules are installed
- [ ] Statistics are recorded

#### Dashboard Backend
- [ ] Server starts on port 3001
- [ ] All REST API endpoints respond
- [ ] WebSocket server accepts connections
- [ ] File watcher detects state changes
- [ ] Commands are written to command file
- [ ] CORS is configured correctly

#### Dashboard Frontend
- [ ] Application builds successfully
- [ ] Dashboard loads in browser
- [ ] Topology visualization displays
- [ ] Slice panel shows all slices
- [ ] Flow panel shows all flows
- [ ] Statistics are displayed
- [ ] WebSocket connection established
- [ ] Real-time updates work

#### Integration
- [ ] Dashboard connects to backend
- [ ] Backend reads simulation state
- [ ] Commands from dashboard reach simulation
- [ ] State changes propagate to dashboard
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Multiple clients can connect simultaneously

#### Claimed Features (From Milestone Document)
- [ ] OMNeT++/INET setup complete
- [ ] SDN modules explored and working
- [ ] Basic cloud topologies built
- [ ] Controller-switch communication verified
- [ ] Dashboard wireframes implemented as working UI
- [ ] Slice management: create/delete/configure
- [ ] Flow table visualization and management
- [ ] Real-time dashboard updates
- [ ] Documentation complete

#### Claimed Features (From Presentation)
- [ ] Live slice list display
- [ ] Create/delete slice features working
- [ ] Assign hosts and bandwidth to slices
- [ ] Flow table panel interactive
- [ ] Add/remove flow rules
- [ ] Dashboard actions reflected in OMNeT++ real-time
- [ ] Tested scenarios work
- [ ] Documentation expanded

### Documentation Deliverables
- [ ] Setup instructions (README.md)
- [ ] API documentation
- [ ] Test scenarios documented
- [ ] Architecture diagram (optional but helpful)
- [ ] Known issues/limitations documented

---

## Summary

This implementation guide covers everything needed to implement Milestone 1 from scratch:

1. **Phase 1**: Basic OMNeT++ simulation with network topology
2. **Phase 2**: Enhanced topology with slice support
3. **Phase 3**: SDN controller with slice and flow management
4. **Phase 4**: REST API backend server
5. **Phase 5**: Interactive web dashboard frontend
6. **Phase 6**: Integration and testing

Each phase includes:
- Detailed implementation steps
- Complete code examples
- Build/test instructions
- Validation checklists

Follow the phases sequentially, validating each before proceeding to the next. The validation checklists ensure nothing is missed.

**Estimated Implementation Time**: 40-60 hours total
- Phase 1-2: 8-10 hours
- Phase 3: 12-15 hours
- Phase 4: 8-10 hours
- Phase 5: 12-15 hours
- Phase 6: 6-8 hours
```
