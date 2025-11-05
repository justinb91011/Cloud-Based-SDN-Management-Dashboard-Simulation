package sdn_dashboard.simulations.networks;

import inet.networklayer.configurator.ipv4.Ipv4NetworkConfigurator;
import inet.node.ethernet.EthernetSwitch;
import inet.node.inet.StandardHost;
// import inet.visualizer.integrated.IntegratedCanvasVisualizer;  // Only needed for GUI
import inet.linklayer.vlan.VlanInterface;
import sdn_dashboard.simulations.SDNControllerApp;

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

        // Visualizer only needed for GUI mode
        // visualizer: IntegratedCanvasVisualizer {
        //     @display("p=100,150");
        // }

        // SDN Controller with enhanced capabilities
        controller: StandardHost {
            @display("p=700,50;i=device/server_l");
            numApps = 1;
            app[0].typename = "SDNControllerApp";
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
            @display("p=100+int(i/hostsPerSlice)*350+60*(i%hostsPerSlice),800");
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
            host[i].ethg++ <--> {datarate=1Gbps; delay=0.1ms;} <--> edgeSwitch[int(i/hostsPerSlice)].ethg++;
        }
}
