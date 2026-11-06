# Reino de Valdemar — 1.5.0

Juego de estrategia y construcción medieval 3D creado desde cero con Three.js, Vite y Electron. El objetivo de esta etapa es pasar de una escena de demostración a un pequeño asentamiento que se pueda administrar: construir, asignar trabajadores, mantener reservas y crecer sin descuidar el cambio de estaciones.

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
- Selecciona una estructura del panel y haz clic en un terreno libre para construirla.
- Pulsa Escape para cancelar el modo de construcción.
- Botón derecho y arrastrar para desplazar la cámara.
- Rueda del ratón para acercar o alejar.
- B para plegar el panel de construcción.
- Espacio para pausar o reanudar.
- Los botones 1×, 2× y 3× cambian la velocidad de la simulación.
- Ctrl + S guarda la partida; también hay guardado automático cada tres días.

## Sistemas incluidos en esta versión

- Mundo 3D con terreno ondulado, río curvo, caminos de tierra, bosque, matorrales y rocas.
- Edificios medievales procedurales diferenciados: casas, granjas, aserradero, cantera, mercado, pozo y torre.
- Aldeanos animados que recorren el asentamiento y se dirigen a sus puestos de trabajo.
- Economía diaria con consumo y producción de alimentos, madera, piedra y oro.
- Estaciones con impacto en el rendimiento de las granjas.
- Población, capacidad de vivienda, mano de obra libre y ánimo del asentamiento.
- Inspección de edificios, asignación de trabajadores, demolición y recuperación parcial de materiales.
- Colocación con previsualización, validación de espacio y comprobación de costes.
- Guardado local y recuperación de partidas anteriores.

## Validación

Ejecuta `npm run check` para revisar la sintaxis de los módulos y ejecutar las pruebas de economía, construcción, trabajadores y estaciones.

## Estado del proyecto

Es una versión de desarrollo jugable, no un producto terminado. Los edificios y personajes actuales usan geometría procedural; todavía faltan modelos artísticos externos, rutas inteligentes, transporte físico de mercancías, combate, sonido y pruebas de equilibrio más extensas.
