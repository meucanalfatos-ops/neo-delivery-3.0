
import React, { useEffect, useRef, useState } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface GoogleMapProps {
  driverLocation: Location;
  destination?: Location | null;
  pickupLocation?: Location | null;
  status: 'idle' | 'offering' | 'going_to_store' | 'at_store' | 'delivering' | 'at_customer' | 'returning_machine' | 'completed';
}

declare global {
  interface Window {
    initMap?: () => void;
    google?: any;
  }
}

// Helper para calcular a rotação (Heading) entre dois pontos
const computeHeading = (src: Location, dst: Location) => {
  const lat1 = (src.lat * Math.PI) / 180;
  const lat2 = (dst.lat * Math.PI) / 180;
  const lng1 = (src.lng * Math.PI) / 180;
  const lng2 = (dst.lng * Math.PI) / 180;
  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
};

const GoogleMapIntegration: React.FC<GoogleMapProps> = React.memo(({ 
  driverLocation: initialDriverLocation, 
  destination, 
  pickupLocation,
  status 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  
  // Estado interno para posição visual suave e rotação
  const [currentPosition, setCurrentPosition] = useState<Location>(initialDriverLocation);
  const positionRef = useRef<Location>(initialDriverLocation);
  const headingRef = useRef<number>(0);

  // 1. Inicializar Mapa
  useEffect(() => {
    const initMap = () => {
      if (mapRef.current && window.google && window.google.maps && !mapInstanceRef.current) {
        
        // Estilo Clean/Vector (Estilo iFood)
        const mapStyles = [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
          { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#333333" }] },
          { featureType: "landscape", stylers: [{ color: "#f3f4f6" }] },
        ];

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          zoom: 18,
          center: initialDriverLocation,
          disableDefaultUI: true,
          styles: mapStyles,
          zoomControl: false,
          tilt: 0, // Começa plano
          heading: 0
        });

        directionsServiceRef.current = new window.google.maps.DirectionsService();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: true,
          preserveViewport: true, // Importante para controlarmos a câmera manualmente
          polylineOptions: {
            strokeColor: '#EA1D2C',
            strokeWeight: 6,
            strokeOpacity: 0.9
          }
        });

        // Marcador do Motorista (Seta de Navegação)
        driverMarkerRef.current = new window.google.maps.Marker({
          position: initialDriverLocation,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#EA1D2C", // Vermelho iFood
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            rotation: 0
          },
          zIndex: 9999,
        });
      }
    };

    if (!window.google || !window.google.maps) {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCeu8MoUya1C8_CAsDSUZrmW4qkZ2jf2SQ&callback=initMap`;
        script.async = true;
        script.defer = true;
        window.initMap = initMap;
        document.body.appendChild(script);
      } else {
        if (!window.initMap) window.initMap = initMap;
        else initMap();
      }
    } else {
      initMap();
    }
  }, []);

  // 2. Lógica de Movimento Suave (Interpolação) e Câmera GPS
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      let target = null;
      // Define o alvo baseado no status para simular movimento em direção a ele
      // NOTA: Em produção real, o "target" seria a próxima coordenada GPS recebida.
      // Aqui usamos o destino final para simular o trajeto caso o GPS esteja parado.
      if (status === 'going_to_store') target = pickupLocation;
      else if (status === 'delivering') target = destination;
      else target = initialDriverLocation; // Se parado, o alvo é o GPS real

      const current = positionRef.current;
      
      // Se temos um alvo e estamos em modo de navegação
      if (target && (status === 'going_to_store' || status === 'delivering')) {
        const latDiff = target.lat - current.lat;
        const lngDiff = target.lng - current.lng;
        
        // Interpolação (Simulação de movimento suave)
        // Se estivermos muito longe do GPS real, pulamos. Se perto, interpolamos.
        // Aqui, usamos uma lógica híbrida: se o GPS mudar (via props), 'initialDriverLocation' muda.
        // Mas para suavidade visual, movemos o marcador em direção ao 'target' (destino) bem devagar.
        
        const moveFactor = 0.005; // Velocidade da animação
        const newLat = current.lat + latDiff * moveFactor;
        const newLng = current.lng + lngDiff * moveFactor;
        const newPos = { lat: newLat, lng: newLng };
        
        // Atualiza refs
        positionRef.current = newPos;
        
        // Calcula rotação (Heading) para a seta apontar pro destino
        const newHeading = computeHeading(current, target);
        // Suaviza a rotação
        const rotationDiff = newHeading - headingRef.current;
        // Lógica simples para evitar giro de 360 desnecessário
        headingRef.current = newHeading; 

        // Atualiza Visual do Marcador e Câmera
        if (driverMarkerRef.current && mapInstanceRef.current) {
           const latLng = new window.google.maps.LatLng(newPos.lat, newPos.lng);
           
           // Atualiza ícone (Seta rotacionada)
           const icon = driverMarkerRef.current.getIcon();
           if (icon) {
             icon.rotation = headingRef.current;
             driverMarkerRef.current.setIcon(icon);
           }
           driverMarkerRef.current.setPosition(latLng);

           // MODO NAVEGAÇÃO (GPS STYLE)
           // Inclina o mapa e rotaciona para frente
           mapInstanceRef.current.moveCamera({
              center: latLng,
              zoom: 18,
              tilt: 45, // Inclinação 3D
              heading: headingRef.current // Mapa gira conforme o carro
           });
        }
      } else {
         // MODO IDLE/PARADO: Sincroniza exatamente com a prop (GPS Real)
         // Sem inclinação, visão de cima
         const targetPos = initialDriverLocation;
         const latDiff = targetPos.lat - current.lat;
         const lngDiff = targetPos.lng - current.lng;
         
         // Pequena interpolação para não "pular" se o GPS atualizar
         if (Math.abs(latDiff) > 0.000001 || Math.abs(lngDiff) > 0.000001) {
            const newPos = {
                lat: current.lat + latDiff * 0.1,
                lng: current.lng + lngDiff * 0.1
            };
            positionRef.current = newPos;
            
            if (driverMarkerRef.current && mapInstanceRef.current) {
               const latLng = new window.google.maps.LatLng(newPos.lat, newPos.lng);
               driverMarkerRef.current.setPosition(latLng);
               
               // Ícone volta a ser um círculo ou mantém seta parada
               const icon = driverMarkerRef.current.getIcon();
               icon.path = window.google.maps.SymbolPath.CIRCLE;
               icon.scale = 8;
               icon.fillColor = "#4285F4"; // Azul Google quando parado
               driverMarkerRef.current.setIcon(icon);

               if (status !== 'offering') {
                  mapInstanceRef.current.moveCamera({
                     center: latLng,
                     zoom: 16,
                     tilt: 0, // Mapa plano
                     heading: 0 // Norte para cima
                  });
               }
            }
         }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [status, pickupLocation, destination, initialDriverLocation]);

  // 3. Desenhar Rota (Polilinha)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps || !directionsServiceRef.current) return;

    const calculateRoute = (origin: Location, dest: Location, color: string, isDashed: boolean = false) => {
      directionsServiceRef.current.route(
        {
          origin: origin,
          destination: dest,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            const polylineOptions: any = {
               strokeColor: color,
               strokeWeight: 6,
               strokeOpacity: 0.8,
            };

            // Estilo pontilhado para "Indo para a Loja"
            if (isDashed) {
               polylineOptions.strokeOpacity = 0; // Esconde linha sólida
               polylineOptions.icons = [{
                  icon: {
                     path: 'M 0,-1 0,1',
                     strokeOpacity: 1,
                     scale: 4,
                     strokeColor: color
                  },
                  offset: '0',
                  repeat: '20px'
               }];
            } else {
               polylineOptions.icons = []; // Remove ícones se for sólida
            }

            directionsRendererRef.current.setOptions({ polylineOptions });
            directionsRendererRef.current.setDirections(result);
          }
        }
      );
    };

    // Limpeza de marcadores antigos
    if (destinationMarkerRef.current) destinationMarkerRef.current.setMap(null);

    // ROTA 1: INDO PARA A LOJA (AZUL / TRACEJADO)
    if (status === 'going_to_store' && pickupLocation) {
      calculateRoute(positionRef.current, pickupLocation, '#3B82F6', false); // Azul iFood Coleta
      
      destinationMarkerRef.current = new window.google.maps.Marker({
        position: pickupLocation,
        map: mapInstanceRef.current,
        label: { text: "🏪", color: "white", fontSize: "16px", fontWeight: "bold" },
        icon: {
           path: window.google.maps.SymbolPath.CIRCLE,
           scale: 14,
           fillColor: "#3B82F6",
           fillOpacity: 1,
           strokeColor: "white",
           strokeWeight: 2
        },
        title: "Loja"
      });

    // ROTA 2: INDO PARA O CLIENTE (VERMELHO / SÓLIDO)
    } else if (status === 'delivering' && destination) {
      calculateRoute(positionRef.current, destination, '#EA1D2C', false); // Vermelho iFood Entrega
      
      destinationMarkerRef.current = new window.google.maps.Marker({
        position: destination,
        map: mapInstanceRef.current,
        label: { text: "🏠", fontSize: "18px" },
        title: "Cliente"
      });

    // ROTA 3: PREVIEW DA OFERTA (Visão Geral)
    } else if (status === 'offering' && pickupLocation && destination) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(pickupLocation);
        bounds.extend(destination);
        mapInstanceRef.current.fitBounds(bounds);
        // Ajuste de Padding para a rota não ficar cortada pelos cards da UI
        mapInstanceRef.current.panToBounds(bounds, { top: 100, right: 50, bottom: 300, left: 50 });
        
        calculateRoute(pickupLocation, destination, '#EA1D2C', false);
    
    // ROTA 4: IDLE (Limpa tudo)
    } else if (status === 'idle') {
        directionsRendererRef.current?.setDirections({ routes: [] });
    }

  }, [status, destination, pickupLocation]);

  return (
    <div 
      ref={mapRef} 
      className="absolute inset-0 w-full h-full z-0"
      style={{ backgroundColor: '#f3f4f6' }}
    />
  );
});

export default GoogleMapIntegration;
