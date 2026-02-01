from zeroconf import ServiceInfo, Zeroconf
import socket

class DeviceDiscovery:
    """
    mDNS/Zeroconf service for network device discovery. 
    
    mDNS allows devices to find the server without knowing its IP, they connect via 'http://filesharer.local:8000'
    Very much optional as a feature. Users can just connect via direct IP. Its just good to have tbh
    """
    
    def __init__(self, port=8000):
        self.port = port
        self.zeroconf = Zeroconf()
        self.info = None
        
    def register(self):
        """ 
        Register this device as a file sharing server on the network 
        Service type: _filesharer._tcp.local.    -->    Other devices can discover this service by listening for this type
        """
        hostname = socket.gethostname()
        local_ip = self.get_local_ip()
        
        self.info = ServiceInfo(
            "_filesahrer._tcp.local.",
            f"FileSharer-{hostname}._filesharer._tcp.local.",
            addresses=[socket.inet_aton(local_ip)],
            port=self.port,
            properties={
                'version': '1.0',
                'name': f'FileSharer on {hostname}'
            },
            server=f"{hostname}.local."
        )
        
        self.zeroconf.register_service(self.info)
        print(f"Service registered: {hostname}.local:{self.port}")
        print(f"Local IP: {local_ip}:{self.port}")
         
    def unregister(self):
        """Clean up mDNS service on shutdown"""
        if self.info:
            self.zeroconf.unregister_service(self.info)
            self.zeroconf.close()
            
    @staticmethod
    def get_local_ip():
        """
        Get the local network IP address. Connect to external IP (doesnt actually send data) to determine which interface is used for net. communication
        """
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"
        
        
if __name__ == "__main__":
    # Test discovery service
    discovery = DeviceDiscovery()
    discovery.register()
    
    try:
        input("Press Enter to stop...\n")
    except KeyboardInterrupt:
        pass
    finally:
        discovery.unregister()