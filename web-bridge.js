/* TANDZUR Desktop: adapter untuk antarmuka Android v1.7.2 */
(function(){
 'use strict';
 const OWNER='kRnQpbGNLAQHIOAAmrL6BpG7olE3';
 const C=window.TANDZUR_FIREBASE_CONFIG;
 let auth,db,user=null,role='',gardenUnsub=null,knownPayload=null,roleResolving=false;
 const ready=(fn)=>{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn()};
 const cb=(name,...args)=>{if(typeof window[name]==='function')window[name](...args)};
 const status=(s)=>cb('tandzurCloudState',s);
 const ownerDoc=()=>db.collection('users').doc(OWNER);
 const garden=()=>ownerDoc().collection('garden').doc('state');
 const members=()=>ownerDoc().collection('members');
 const allowed=()=>!!user&&['owner','admin','super_admin'].includes(role);
 const manager=()=>!!user&&['owner','super_admin'].includes(role);
 const fail=(prefix,e)=>status(prefix+': '+(e?.message||String(e)));
 const stop=()=>{if(gardenUnsub){gardenUnsub();gardenUnsub=null}knownPayload=null};
 const cleanEmail=e=>String(e||'').trim().toLowerCase();
 async function resolveRole(u){
   stop();role='';user=u;
   if(!u){cb('tandzurRoleChanged','blocked','');cb('tandzurCloudUser','','');return}
   try{
     let nickname='Gus';
     if(u.uid===OWNER)role='owner';
     else{
       const email=cleanEmail(u.email);
       if(!email||!u.emailVerified)throw Error('Email Google belum terverifikasi');
       const snap=await members().doc(email).get({source:'server'});
       if(!snap.exists||snap.data()?.active!==true)throw Error('Gmail belum diundang atau akses dicabut');
       const m=snap.data();role=m.role==='super_admin'?'super_admin':'admin';nickname=m.nickname||'Admin';
     }
     cb('tandzurRoleChanged',role,nickname);
     cb('tandzurCloudUser',u.email||'',u.uid);
     status('☁️ Menghubungkan ke kebun bersama…');
     gardenUnsub=garden().onSnapshot({includeMetadataChanges:true},snap=>{
       if(!allowed())return;
       if(!snap.exists){cb('tandzurCloudEmpty');return}
       const payload=snap.data()?.payload;
       if(typeof payload!=='string'){status('⚠️ Dokumen cloud tidak berisi payload');return}
       if(payload!==knownPayload){knownPayload=payload;cb('tandzurCloudIncoming',payload)}
       if(!snap.metadata.fromCache&&!snap.metadata.hasPendingWrites)cb('tandzurCloudVerified',true,'',payload);
     },e=>fail('Gagal membaca cloud',e));
   }catch(e){role='blocked';cb('tandzurRoleChanged','blocked','');status('Gagal memeriksa akses: '+e.message);}
 }
 window.TandzurAndroid={
   appReady(){ if(!auth){status('Konfigurasi Web belum siap');return}cb('tandzurNativeReady',!!auth.currentUser);if(auth.currentUser)resolveRole(auth.currentUser); },
   async cloudLogin(){
     if(!auth){status('Firebase Web belum dikonfigurasi. Periksa firebase-config.js');return}
     try{status('Membuka login Google…');const provider=new firebase.auth.GoogleAuthProvider();
       const result=await auth.signInWithPopup(provider);await resolveRole(result.user);
     }catch(e){fail('Gagal login Google',e)}
   },
   async cloudLogout(){stop();role='';try{await auth.signOut()}catch(e){fail('Gagal keluar',e)}},
   async cloudPush(payload){if(!allowed()){status('Akses kebun belum disetujui');return}
     try{JSON.parse(payload);await garden().set({payload,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});knownPayload=payload;cb('tandzurCloudSaved',payload)}catch(e){fail('Gagal unggah',e)}
   },
   async cloudVerify(){if(!allowed())return;try{const snap=await garden().get({source:'server'});if(!snap.exists)throw Error('Data cloud belum ada');cb('tandzurCloudVerified',true,'',snap.data()?.payload||'')}catch(e){cb('tandzurCloudVerified',false,e.message)}},
   async cloudPull(){if(!allowed())return;try{const snap=await garden().get({source:'server'});if(snap.exists&&typeof snap.data()?.payload==='string')cb('tandzurCloudIncoming',snap.data().payload);else cb('tandzurCloudEmpty')}catch(e){fail('Gagal mengambil data',e)}},
   async addGardenAdminWithRole(email,nickname,newRole){
     if(!manager())return status('Hanya Owner/Super Admin dapat mengelola anggota');
     email=cleanEmail(email);nickname=String(nickname||'').trim();
     if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!nickname||nickname.length>40||!['admin','super_admin'].includes(newRole))return status('Data anggota tidak valid');
     try{await members().doc(email).set({email,nickname,role:newRole,active:true});status('Akses tersimpan: '+email);this.listGardenAdmins()}catch(e){fail('Gagal menambahkan anggota',e)}
   },
   addGardenAdmin(email,nickname){return this.addGardenAdminWithRole(email,nickname,'admin')},
   async removeGardenAdmin(email){if(!manager())return status('Tidak punya izin mengelola anggota');try{await members().doc(cleanEmail(email)).delete();status('Akses anggota dicabut');this.listGardenAdmins()}catch(e){fail('Gagal mencabut akses',e)}},
   async listGardenAdmins(){if(!manager())return;try{const snap=await members().get({source:'server'});cb('tandzurAdminList',snap.docs.map(d=>({email:d.id,nickname:d.data().nickname||'Admin',role:d.data().role||'admin'})))}catch(e){fail('Gagal membaca anggota',e)}},
   requestNotifications(){if('Notification' in window&&location.protocol==='https:')Notification.requestPermission().then(x=>status('Izin notifikasi: '+x));else status('Notifikasi browser memerlukan HTTPS')},
   syncSnapshot(){},
   exportBackup(json){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([json],{type:'application/json'}));a.href=url;a.download='tandzur-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)},
   importBackup(){document.getElementById('importfile')?.click()}
 };
 ready(()=>{
   try{
     if(!C||!C.appId||C.appId.includes('GANTI_'))throw Error('Isi appId aplikasi Web Firebase pada firebase-config.js');
     firebase.initializeApp(C);auth=firebase.auth();db=firebase.firestore();
     auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(e=>fail('Sesi login',e));
     auth.onAuthStateChanged(u=>{
       if(!u){stop();role='';user=null;cb('tandzurRoleChanged','blocked','');cb('tandzurCloudUser','','');}
       else if(!user||user.uid!==u.uid)resolveRole(u);
     });
   }catch(e){status('Konfigurasi Firebase Web: '+e.message);window.TANDZUR_WEB_CONFIG_ERROR=e.message}
 });
})();
