# Datos, recuperación y actualizaciones

La configuración se prepara por el vendedor, nunca se importa desde la interfaz del cliente. Cada entrega incluye su menú e identidad. Los archivos estáticos no incluyen registros de operación.

## Instalaciones independientes

Con configuración de instalación, la clave es `mesaos:<subruta codificada>:<restaurant.id>:expediente:v2`. El formato interno conserva pedidos, numeración, borrador, adición, caja, propinas, cortes y preferencia de cola del sistema original.

La compatibilidad del núcleo sin configuración se conserva para ejecutar las suites originales. En el POS publicado siempre se carga config/installation.js antes del dominio; así no se usa la clave real `amor-amor-pos:expediente:v2` ni se recupera automáticamente su borrador.

No se eliminaron ni se sobrescribieron datos de navegadores reales. El menú, PDF, imágenes y tests originales del árbol fuente se conservan; el paquete generado los excluye según corresponda.

## Migrar una instalación real de Amor & Amor

Debe hacerse como trabajo específico con exportación validada del expediente en su origen original y destino identificado. Esta corrección del flujo comercial no realiza migraciones silenciosas ni mezcla registros. Mantener archivos/origen/perfil anteriores, conservar un respaldo crudo completo y verificar cada saldo, movimiento y corte antes de cambiar de instalación.

El almacenamiento local no se transporta al copiar el repositorio. No recomendar borrar datos del navegador como procedimiento de actualización. Una nueva instancia sin ventas se genera con id nuevo; un cliente existente conserva id y URL. No modificar moneda o zona horaria de ventas guardadas sin migración.

## Recuperación del código

La copia local previa a esta corrección está en backups/before-vendor-template-20261017.tar.gz, ignorada por Git. Es un respaldo de archivos fuente y pruebas, no de ventas del navegador. La rama de trabajo no modifica el historial de main.

## Precaución con cambios de catálogo

Los pedidos confirmados guardan snapshots históricos. El borrador y las selecciones de adición siguen el comportamiento original y se reconstruyen con el menú al recargar; deben confirmarse o descartarse antes de publicar cambios de menú. Una entrega de prueba no debe utilizar el mismo origen/perfil de una caja real para validar ventas ficticias.
