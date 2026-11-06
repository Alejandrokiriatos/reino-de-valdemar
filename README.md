# Reino de Valdemar — 2.0.0

Juego de estrategia y construcción medieval 3D creado desde cero con Three.js, Vite y Electron. La versión 2.0 añade caravanas mercantes con visitas periódicas, inventario limitado y comercio de recursos, además de una carreta de comerciantes visible en el asentamiento. Agricultura y ganadería siguen conectadas: el ganado necesita alimento y espacio, produce leche y abono, puede reproducirse y ayuda a recuperar la fertilidad de los campos.

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
- Pulsa B para plegar el panel de construcción.
- Pulsa F o el botón de calendario para consultar el pronóstico de los próximos tres días.
- Espacio para pausar o reanudar.
- Los botones 1×, 2× y 3× cambian la velocidad de la simulación.
- Ctrl + S guarda la partida; también hay guardado automático cada tres días.

## Sistemas incluidos

- Mundo 3D procedural con colinas, terreno con variación de color, río curvo, hierba, bosques, matorrales y rocas.
- Vegetación instanciada para reducir llamadas de dibujo y mejorar el rendimiento.
- Ciclo día/noche, niebla, sombras, fogata animada con humo y cambios estacionales.
- Clima diario: cielos despejados, nubes, lluvia, tormentas, sequía y nieve.
- Efectos visuales de lluvia y nieve, relámpagos durante tormentas y terreno que cambia según el clima.
- El clima afecta a las cosechas, pesca, recuperación de fauna, consumo de leña y velocidad de los desplazamientos.
- Pronóstico de tres días con consejos para preparar cosechas, leña y desplazamientos.
- Puente de madera transitable que conecta ambas riberas y una red de caminos de aldea.
- Conexiones de camino automáticas para nuevos edificios; los ramales se eliminan al demoler su edificio.
- Los aldeanos recorren caminos, trabajan, llevan mercancías en carretas con ruedas y descargan productos en el almacén.
- Patio de almacén con montones visibles de comida, madera, piedra, oro y abono; su cantidad se conserva al guardar y continuar.
- Capacidad compartida de almacenamiento: los almacenes adicionales la amplían y la producción excedente se pierde si no hay espacio.
- Establo y corral construibles, con vacas animadas que permanecen en el recinto.
- Caravanas mercantes que visitan el valle en días programados, permanecen tres días y regresan tras un intervalo de viaje.
- Comercio de alimentos, madera, piedra y abono con precios estacionales, existencias limitadas, compras y ventas en lotes de diez unidades.
- Carreta y mercaderes visibles junto al camino mientras la caravana está en el valle; las visitas y existencias se conservan al guardar.
- Ganado que necesita alimento, produce leche y abono, puede reproducirse y aumenta la demanda diaria de comida.
- Compra de reses con oro y límites de capacidad por establo; no se puede retirar un establo si deja al ganado sin espacio.
- Las granjas pierden fertilidad al cultivarse. El estiércol almacenado permite abonar los campos y recuperar su rendimiento.
- Ciervos en pequeñas manadas; la caza reduce la fauna y esta se recupera según el clima.
- Puesto de pesca junto al río; las capturas reducen las reservas de peces, que se regeneran con el tiempo.
- Casas, granjas, aserradero, cantera, torre, mercado, pozo, almacén, cabaña de cazadores y puesto de pesca.
- Economía diaria, producción por trabajadores, consumo de alimentos y leña, vivienda, población, ánimo y estaciones.
- Inspección de edificios, asignación y retirada de trabajadores, demolición y devolución parcial de materiales.
- Colocación con comprobación de costes, espacio y acceso al río.
- Guardado local, migración de partidas anteriores, restauración de cámara y guardado automático.

## Validación

Ejecuta `npm run check` para comprobar la sintaxis de los módulos y ejecutar las pruebas de economía, construcción, trabajadores, estaciones, caza, pesca, almacenamiento, clima, ganado, fertilidad de los campos y comercio con caravanas.

## Estado del proyecto

Es una versión de desarrollo, no un producto terminado. Los edificios, personajes, fauna y ganado utilizan geometría procedural, no modelos artísticos externos. Todavía faltan combate, comercio con caravanas, cadenas de producción más profundas, sonidos, efectos de clima acumulado, navegación avanzada con obstáculos y una pasada completa de arte y equilibrio.
