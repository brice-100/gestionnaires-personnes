// ==============================
// 1. IMPORTS FIREBASE (v9+)
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==============================
// 2. CONFIGURATION FIREBASE
// ==============================
const firebaseConfig = {
  apiKey: "AIzaSyDvf4YEVgH6jPCwPc47MfGukKlg4I7hKOI",
  authDomain: "gestionnaire-de-personnes.firebaseapp.com",
  projectId: "gestionnaire-de-personnes",
  storageBucket: "gestionnaire-de-personnes.appspot.com",
  messagingSenderId: "894494968390",
  appId: "1:894494968390:web:7ce11da117b34a44fa1847"
};

// ==============================
// 3. INITIALISATION
// ==============================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Référence vers la collection "personnes"
const personnesRef = collection(db, "personnes");

console.log("✅ Firebase et Firestore initialisés");

// ==============================
// 4. CHARGEMENT LOCALSTORAGE
// ==============================
window.addEventListener("DOMContentLoaded", () => {
  const savedNomListe = localStorage.getItem("nomliste");
  if (savedNomListe) {
    document.getElementById("nomliste").value = savedNomListe;
  }
});

// ==============================
// 5. GESTION DU FORMULAIRE
// ==============================
document.getElementById("personForm").addEventListener("submit", (e) => {
  e.preventDefault();
  ajouterPersonne();
});

// ==============================
// 6. AJOUT D’UNE PERSONNE
// ==============================
async function ajouterPersonne() {
  const nomliste  = document.getElementById("nomliste").value.trim();
  const nom       = document.getElementById("nom").value.trim();
  const prenom    = document.getElementById("prenom").value.trim();
  const matricule = document.getElementById("matricule").value.trim();
  const classe    = document.getElementById("classe").value.trim();

  if (!nomliste || !nom || !prenom) {
    alert("Veuillez remplir les champs obligatoires");
    return;
  }

  try {
    await addDoc(personnesRef, {
      nomliste,
      nom,
      prenom,
      matricule,
      classe,
      createdAt: serverTimestamp()
    });

    alert("✅ Personne ajoutée avec succès !");
    localStorage.setItem("nomliste", nomliste);
    document.getElementById("personForm").reset();
    window.location.href = "liste.html";

  } catch (error) {
    console.error("❌ Erreur Firestore :", error);
    alert("Erreur lors de l'ajout");
  }
}
