# Reino de Valdemar — 1.7.0

Juego de estrategia y construcción medieval 3D creado desde cero con Three.js, Vite y Electron. La aldea ya cuenta con una primera red logística: trabajadores que recorren caminos, llevan recursos en carretas, cruzan el río por un puente y descargan mercancías en un almacén con capacidad limitada.

## Ejecutar en Windows

Necesitas Node.js 20 o superior.

    npm install
    npm run start

Abre la dirección local que indique Vite. Para la ventana de escritorio, deja Vite ejecutándose y abre otra terminal:

    npm run desktop

Para generar un ejecutable portable en Windows:

    npm run dist

## Controles

- Clic izquierdo sobre un edificio para inspeccionarlo.
- Selecciona una estructura del panel y haz clic en terreno libre para construirla.
- Pulsa Escape para cancelar el modo de construcción.
- Botón derecho y arrastrar para desplazar la cámara.
- Rueda del ratón para acercar o alejar.
- B para plegar el panel de construcción.
- Espacio para pausar o reanudar.
- Los botones 1×, 2× y 3× cambian la velocidad de la simulación.
- Ctrl + S guarda la partida; también hay guardado automático cada tres días.

## Sistemas incluidos

- Mundo 3D procedural con colinas, terreno con variación de color, río curvo, hierba, bosque, matorrales y rocas.
- Vegetación instanciada para reducir llamadas de dibujo y mejorar el rendimiento.
- Ciclo día/noche, niebla, sombras, cambios estacionales y fogata animada con humo.
- Puente de madera transitable que conecta ambas riberas y una red de caminos de aldea.
- Conexiones de camino automáticas para nuevos edificios; los ramales se eliminan al demoler su edificio.
- Los aldeanos encuentran recorridos por la red de caminos. Las carretas avanzan mejor por caminos y pierden velocidad fuera de ellos.
- Aldeanos animados que trabajan, cargan comida, troncos, piedra u oro y los llevan físicamente al almacén en carretas con ruedas animadas.
- Patio de almacén con montones visibles de mercancías; los montones y su cantidad visual se conservan al guardar y continuar.
- Capacidad de almacén compartida por todos los recursos: al llenarse, parte de la producción no se puede almacenar. Los almacenes adicionales amplían la capacidad.
- Casas, granjas, aserradero, cantera, torre, mercado, pozo, almacén, cabaña de cazadores y puesto de pesca.
- Ciervos en pequeñas manadas; la caza reduce la fauna y esta se recupera si se deja descansar.
- Pesca junto al río; las capturas reducen las reservas de peces, que se regeneran con el tiempo.
- Economía diaria, producción por trabajadores, consumo de alimentos y leña, vivienda, población, ánimo y estaciones.
- Inspección de edificios, asignación y retirada de trabajadores, demolición y devolución parcial de materiales.
- Colocación con comprobación de costes, espacio y acceso al río.
- Guardado local, migración de partidas anteriores, restauración de cámara y guardado automático.

## Validación

Ejecuta `npm run check` para comprobar la sintaxis de los módulos y ejecutar las pruebas de economía, construcción, trabajadores, estaciones, caza, pesca, almacenamiento y migración de partidas.

## Estado del proyecto

Es una versión de desarrollo, no un producto terminado. Los edificios, personajes, fauna y carretas utilizan geometría procedural, no modelos artísticos externos. Todavía faltan combate, comercio con caravanas, cadenas de producción más profundas, navegación con obstáculos y multirruta avanzada, sonidos, efectos de clima y una pasada de arte y balance.
