package sdn_dashboard.src.controller;

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
