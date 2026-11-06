# Reino de Valdemar — 2.1.0

Juego de estrategia y construcción medieval 3D creado desde cero con Three.js, Vite y Electron. La versión 2.1 amplía el valle a 420 × 420 unidades, incorpora cuatro civilizaciones vecinas, bosques más densos y materiales procedurales con textura y relieve para suelo, madera, piedra, tejados y caminos. Se corrige la cámara orbital, se detallan los aldeanos y los leñadores salen al bosque a talar árboles, dejar tocones y regresar con troncos. El administrador de subsistencia prioriza las granjas cuando escasea la comida.

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
- Botón derecho y arrastrar para orbitar la cámara; ambos ejes siguen el gesto.
- Botón central y arrastrar para desplazar el mapa; también funciona con Mayús + botón izquierdo.
- Rueda del ratón para acercar o alejar, con un rango mucho mayor.
- Pulsa B para plegar el panel de construcción.
- Pulsa F o el botón de calendario para consultar el pronóstico de los próximos tres días.
- Espacio para pausar o reanudar.
- Los botones 1×, 2× y 3× cambian la velocidad de la simulación.
- Ctrl + S guarda la partida; también hay guardado automático cada tres días.

## Sistemas incluidos

- Mundo 3D procedural de 420 × 420 unidades, con más de nueve mil matas de hierba, grandes bosques agrupados, matorrales, rocas y relieve de mayor densidad.
- Texturas procedurales de alta resolución con mapas de relieve para terreno, caminos, madera, corteza, piedra, yeso, tejados y telas; no dependen de recursos externos ni licencias de terceros.
- Cuatro civilizaciones vecinas con siete casas, torre central, estandartes y rótulos propios.
- Aldeanos con rostro, ojos, sombrero, cinturón, bolsa, botas y vestimenta con mayor detalle.
- Cámara orbital corregida, desplazamiento independiente, límites adaptados al mapa y zoom ampliado.
- Leñadores que caminan hasta árboles reales, talan, dejan tocones visibles y transportan troncos al almacén; los árboles vuelven a crecer lentamente.
- Reserva forestal económica: la madera disponible depende del bosque y su regeneración es gradual.
- Administrador que reasigna mano de obra libre a las granjas cuando la comida baja de cinco días de consumo.
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
