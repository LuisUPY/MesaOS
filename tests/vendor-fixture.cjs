/* Fixture de los escenarios originales: no se incluye en entregas. */
const fs=require('node:fs'),path=require('node:path');
const legacyFixture={schemaVersion:1,ready:true,restaurant:{id:'legacy-fixture',name:'AMOR & AMOR',logo:'assets/img/logo.png',currency:'MXN',locale:'es-MX',timezone:'America/Merida',address:'',phone:'',welcome:'Un buen día empieza aquí.',tagline:''},theme:{primary:'#183d32',accent:'#e69aae'},ticket:{header:'',footer:'Con Amor, Amor & Amor Cafetería',menuPdf:''},menu:JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/menu.json'),'utf8'))};
module.exports={legacyFixture};
