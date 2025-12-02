#ifndef __SDN_DASHBOARD_SDNCONTROLLER_H
#define __SDN_DASHBOARD_SDNCONTROLLER_H

#include <inet/applications/base/ApplicationBase.h>
#include <inet/common/INETDefs.h>
#include <inet/transportlayer/contract/udp/UdpSocket.h>
#include <map>
#include <omnetpp.h>
#include <string>
#include <vector>

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
  std::string action; // "forward", "drop", "modify"
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

// Metrics snapshot for time-series history
struct SliceMetrics {
  int sliceId;
  double latency;
  double throughput;
};

struct MetricsSnapshot {
  double timestamp;
  std::vector<SliceMetrics> slices;
};

class SDNControllerApp : public ApplicationBase {
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

  // Command processing
  std::string commandFile;
  simtime_t lastCommandCheck;
  cMessage *checkCommandTimer;

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

  // Command processing
  virtual void processCommands();
  virtual void parseAndExecuteCommand(const std::string &cmdJson);
  virtual void exportMetrics();

protected:
  // Metrics export
  std::ofstream *metricsFile;
  simtime_t lastMetricsExport;
  std::vector<MetricsSnapshot> metricsHistory;
  static const int MAX_HISTORY_SIZE = 1000;

public:
  SDNControllerApp();
  virtual ~SDNControllerApp();

  // API for external access
  const std::map<int, FlowRule> &getFlowTable() const { return flowTable; }
  const std::map<int, NetworkSlice> &getSlices() const { return slices; }
  int addFlow(const FlowRule &rule);
  bool removeFlow(int flowId);
  int addSlice(const NetworkSlice &slice);
  bool removeSlice(int sliceId);
};

} // namespace sdn_dashboard

#endif
