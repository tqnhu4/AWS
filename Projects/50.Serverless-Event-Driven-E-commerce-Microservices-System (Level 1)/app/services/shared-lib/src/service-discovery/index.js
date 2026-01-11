// post-service/src/serviceDiscovery.js
let discoveryClient;

if (process.env.CLOUD === 'aws') {
  // AWS CloudMap
  const {
    ServiceDiscoveryClient,
    RegisterInstanceCommand
  } = require("@aws-sdk/client-servicediscovery");

  const servicediscovery = new ServiceDiscoveryClient({
    region: process.env.AWS_REGION
  });

  discoveryClient = {
    register: async (serviceName, instanceId, ip, port) => {
      //EC2
      /*
      const command = new RegisterInstanceCommand({
        ServiceId: process.env.CLOUDMAP_SERVICE_ID, // từ CloudFormation / Env
        InstanceId: instanceId,
        Attributes: {
          AWS_INSTANCE_IPV4: ip,
          AWS_INSTANCE_PORT: port.toString(),
        },
      });

      await servicediscovery.send(command);
      */

      //ÉCS 
      return;
    }
  };
} else {
  // Local Consul
  const Consul = require('consul');
  const consul = new Consul({ host: 'consul', port: 8500 });
  discoveryClient = {
    register: async (serviceName, instanceId, ip, port) => {
      await consul.agent.service.register({
        name: serviceName,
        id: instanceId,
        address: ip,
        port: port,
        check: { http: `http://${ip}:${port}/health`, interval: '10s' },
      });
    }
  };
}

module.exports = discoveryClient;
