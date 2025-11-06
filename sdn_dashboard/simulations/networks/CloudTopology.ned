package sdn_dashboard.simulations.networks;

import inet.networklayer.configurator.ipv4.Ipv4NetworkConfigurator;
import inet.node.ethernet.EthernetSwitch;
import inet.node.inet.StandardHost;

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
            @display("p=100+int(i/hostsPerTenant)*400+50*(i%hostsPerTenant),650");
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
            host[i].ethg++ <--> {datarate=100Mbps; delay=0.1ms;} <--> edgeSwitch[int(i/hostsPerTenant)].ethg++;
        }
}
