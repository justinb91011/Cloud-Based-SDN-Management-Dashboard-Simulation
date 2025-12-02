package sdn_dashboard.simulations.networks;

import inet.networklayer.configurator.ipv4.Ipv4NetworkConfigurator;
import inet.node.ethernet.EthernetSwitch;
import inet.node.inet.StandardHost;
import sdn_dashboard.src.controller.SDNControllerApp;

network SimpleTopology
{
    parameters:
        int numTenants = default(2);
        int hostsPerTenant = default(2);
        @display("bgb=800,600");

    submodules:
        configurator: Ipv4NetworkConfigurator {
            @display("p=50,50");
        }

        // SDN Controller
        controller: StandardHost {
            @display("p=400,50;i=device/server2");
            numApps = 1;
            app[0].typename = "sdn_dashboard.src.controller.SDNControllerApp";
        }

        // Central Switch
        switch: EthernetSwitch {
            @display("p=400,300");
        }

        // Tenant Hosts
        host[numTenants*hostsPerTenant]: StandardHost {
            @display("p=100+i*150,500");
        }

    connections:
        // Controller to Switch
        controller.ethg++ <--> {datarate=1Gbps; delay=1ms;} <--> switch.ethg++;

        // Hosts to Switch
        for i=0..numTenants*hostsPerTenant-1 {
            host[i].ethg++ <--> {datarate=100Mbps; delay=0.1ms;} <--> switch.ethg++;
        }
}
