# Reino de Valdemar — 1.8.0

Juego de estrategia y construcción medieval 3D creado desde cero con Three.js, Vite y Electron. Esta versión incorpora un clima dinámico que afecta al aspecto del valle, la agricultura, las reservas de pesca, el consumo de leña y la movilidad de los trabajadores.

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
- Pulsa F o el botón de calendario para consultar el pronóstico de los próximos tres días.
- Botón derecho y arrastrar para desplazar la cámara.
- Rueda del ratón para acercar o alejar.
- B para plegar el panel de construcción.
- Espacio para pausar o reanudar.
- Los botones 1×, 2× y 3× cambian la velocidad de la simulación.
- Ctrl + S guarda la partida; también hay guardado automático cada tres días.

## Sistemas incluidos

- Mundo 3D procedural con colinas, terreno con variación de color, río curvo, hierba, bosques, matorrales y rocas.
- Vegetación instanciada para reducir llamadas de dibujo y mejorar el rendimiento.
- Ciclo día/noche, niebla, sombras, fogata animada con humo y cambios estacionales.
- Clima diario determinista: cielos despejados, nubes, lluvia, tormentas, sequía y nieve.
- Efectos visuales de lluvia y nieve, relámpagos durante tormentas, luz ambiental y terreno que cambia según el clima.
- Pronóstico de tres días con consejos para preparar cosechas, leña y desplazamientos.
- El tiempo afecta a las cosechas, la recuperación de peces, el consumo de leña en nevadas y la velocidad de desplazamiento.
- Puente de madera transitable que conecta ambas riberas y una red de caminos de aldea.
- Conexiones de camino automáticas para nuevos edificios; los ramales se eliminan al demoler su edificio.
- Los aldeanos encuentran recorridos por la red de caminos. Las carretas avanzan mejor por caminos y pierden velocidad fuera de ellos o con mal tiempo.
- Aldeanos animados que trabajan, cargan comida, troncos, piedra u oro y los llevan físicamente al almacén en carretas con ruedas animadas.
- Patio de almacén con montones visibles de mercancías; los montones y su cantidad visual se conservan al guardar y continuar.
- Capacidad de almacén compartida por todos los recursos: al llenarse, parte de la producción no se puede almacenar. Los almacenes adicionales amplían la capacidad.
- Casas, granjas, aserradero, cantera, torre, mercado, pozo, almacén, cabaña de cazadores y puesto de pesca.
- Ciervos en pequeñas manadas; la cantidad visible responde a la reserva de fauna, y la caza o la sequía pueden reducirla.
- Pesca junto al río; las capturas reducen las reservas de peces, que se regeneran con el tiempo.
- Economía diaria, producción por trabajadores, consumo de alimentos y leña, vivienda, población, ánimo y estaciones.
- Inspección de edificios, asignación y retirada de trabajadores, demolición y devolución parcial de materiales.
- Colocación con comprobación de costes, espacio y acceso al río.
- Guardado local, migración de partidas anteriores, restauración de cámara y guardado automático.

## Validación

Ejecuta `npm run check` para comprobar la sintaxis de los módulos y ejecutar las pruebas de economía, construcción, trabajadores, estaciones, caza, pesca, almacenamiento, clima y migración de partidas.

## Estado del proyecto

Es una versión de desarrollo, no un producto terminado. Los edificios, personajes, fauna y carretas utilizan geometría procedural, no modelos artísticos externos. Todavía faltan combate, comercio con caravanas, cadenas de producción más profundas, sonido, lluvia acumulada sobre superficies, navegación con obstáculos y una pasada completa de arte y equilibrio.
