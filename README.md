# Reino de Valdemar — 1.6.0

Juego de estrategia y construcción medieval 3D creado desde cero con Three.js, Vite y Electron. Esta versión se centra en que el asentamiento empiece a funcionar como un pequeño ecosistema: los trabajadores recorren la aldea, llevan mercancías al almacén y la economía depende también de la fauna y los peces del valle.

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

- Mundo 3D con terreno de coloración procedural, colinas, río curvo, caminos, hierba instanciada, bosques y rocas.
- Optimización de vegetación mediante instancias para reducir llamadas de dibujo.
- Ciclo de luz diurna/nocturna, niebla, sombras y cambios de color por estación.
- Hogares, granjas, aserradero, cantera, torre, mercado, pozo, almacén y cabaña de cazadores.
- Puesto de pesca construible en la orilla, con muelle y redes.
- Aldeanos animados que van a sus puestos, realizan tareas, cargan mercancías y las llevan físicamente al patio del almacén.
- Acopios visibles de comida, madera, piedra y oro entregados por los trabajadores.
- Fauna silvestre con pequeños grupos de ciervos; la caza puede reducir la población animal y esta se recupera con el tiempo.
- Reservas de peces que se agotan por la pesca intensiva y se regeneran cuando se deja descansar el río.
- Economía diaria, estaciones, consumo de comida y leña, vivienda, crecimiento, ánimo y asignación de trabajadores.
- Inspección de edificios, contratación, despido, demolición y devolución parcial de materiales.
- Colocación con validación de costes, espacio y acceso al río cuando corresponde.
- Guardado local, migración de partidas anteriores y restauración de la cámara.

## Validación

Ejecuta npm run check para comprobar la sintaxis de los módulos y ejecutar las pruebas de economía, construcción, trabajadores, estaciones, caza, pesca y migración de partidas.

## Estado del proyecto

Es una versión de desarrollo, no un producto terminado. Los personajes y edificios se construyen con geometría procedural. Todavía faltan navegación avanzada para evitar obstáculos, transporte con carretas, cadena de producción de varios pasos, comercio con caravanas, combate, sonido, modelos artísticos definitivos y pruebas de equilibrio más amplias.
