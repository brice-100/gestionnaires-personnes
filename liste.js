// ==============================
// IMPORTS FIREBASE (v9)
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==============================
// CONFIG FIREBASE
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
// INITIALISATION
// ==============================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const personnesRef = collection(db, "personnes");

console.log("✅ Firebase prêt");

// ==============================
// MODE ADMIN
// ==============================
const ADMIN_PASSWORD = "admin123";
let isAdminMode = false;
let toutesLesPersonnes = [];

// ==============================
// ELEMENTS DOM
// ==============================
const adminBtn = document.getElementById("adminBtn");
const downloadBtn = document.getElementById("downloadBtn");
const loading = document.getElementById("loading");
const personTable = document.getElementById("personTable");
const tableBody = document.getElementById("tableBody");
const emptyMessage = document.getElementById("emptyMessage");
const listNameSpan = document.getElementById("listName");

// ==============================
// CHARGEMENT INITIAL
// ==============================
window.addEventListener("DOMContentLoaded", chargerPersonnes);

// ==============================
// BOUTON ADMIN
// ==============================
adminBtn.addEventListener("click", () => {
  if (isAdminMode) {
    isAdminMode = false;
    adminBtn.textContent = "Mode Admin";
    downloadBtn.style.display = "none";
    retirerIndicateurAdmin();
  } else {
    const password = prompt("Entrer le mot de passe admin");
    if (password === ADMIN_PASSWORD) {
      isAdminMode = true;
      adminBtn.textContent = "Quitter admin";
      downloadBtn.style.display = "inline-block";
      ajouterIndicateurAdmin();
    } else {
      alert("Mot de passe incorrect !");
    }
  }
  chargerPersonnes();
});

// ==============================
// INDICATEUR ADMIN
// ==============================
function ajouterIndicateurAdmin() {
  if (!document.querySelector(".admin-indicator")) {
    const div = document.createElement("div");
    div.className = "admin-indicator";
    div.textContent = "⚠️ MODE ADMINISTRATEUR ACTIVÉ";
    document.querySelector(".container").prepend(div);
  }
}

function retirerIndicateurAdmin() {
  document.querySelector(".admin-indicator")?.remove();
}

// ==============================
// SUPPRESSION
// ==============================
window.supprimerPersonne = async function(id, nom, prenom) {
    if (confirm(`Supprimer ${prenom} ${nom} ?`)) {
        try {
            await deleteDoc(doc(db, "personnes", id));
            alert("✅ Personne supprimée");
        } catch (error) {
            console.error("❌ Erreur Firestore :", error);
            alert("Erreur lors de la suppression");
        }}}

// ==============================
// CHARGEMENT DES PERSONNES
// ==============================
function chargerPersonnes() {
  const q = query(personnesRef, orderBy("nom"));

  onSnapshot(q, (snapshot) => {
    tableBody.innerHTML = "";
    toutesLesPersonnes = [];

    if (snapshot.empty) {
      loading.style.display = "none";
      emptyMessage.style.display = "block";
      personTable.style.display = "none";
      return;
    }

    loading.style.display = "none";
    emptyMessage.style.display = "none";
    personTable.style.display = "table";

    snapshot.forEach((docSnap) => {
      toutesLesPersonnes.push({ id: docSnap.id, ...docSnap.data() });
    });

    listNameSpan.textContent = toutesLesPersonnes[0].nomliste;

    toutesLesPersonnes.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.nom}</td>
        <td>${p.prenom}</td>
        <td>${p.matricule}</td>
        <td>${p.classe}</td>
        ${isAdminMode ? `<td><button onclick="supprimerPersonne('${p.id}','${p.nom}','${p.prenom}')">Supprimer</button></td>` : ""}
      `;
      tableBody.appendChild(tr);
    });
  });
  console.log("Personnes chargées :", toutesLesPersonnes);
// ==============================
// TÉLÉCHARGEMENT PDF MODERNE
// ==============================
downloadBtn.addEventListener("click", () => {
  if (!isAdminMode) return alert("Mode admin requis");
  if (toutesLesPersonnes.length === 0) return alert("Aucune donnée");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const nomListe = toutesLesPersonnes[0].nomliste || "Liste";

  // ======================
  // HEADER MODERNE
  // ======================
  pdf.setFillColor(33, 150, 243); // bleu moderne
  pdf.rect(0, 0, 210, 30, "F");

  pdf.setTextColor(255);
  pdf.setFontSize(18);
  pdf.text("GESTION DES PERSONNES", 105, 14, { align: "center" });

  pdf.setFontSize(12);
  pdf.text(`Liste : ${nomListe}`, 105, 22, { align: "center" });

  // ======================
  // TABLEAU
  // ======================
  const tableData = toutesLesPersonnes.map(p => [
    p.nom,
    p.prenom,
    p.matricule,
    p.classe
  ]);

  pdf.autoTable({
    startY: 40,
    head: [["Nom", "Prénom", "Matricule", "Classe"]],
    body: tableData,
    theme: "striped",
    styles: {
      fontSize: 10,
      cellPadding: 4
    },
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      fontStyle: "bold"
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { left: 10, right: 10 }
  });

  // ======================
  // FOOTER
  // ======================
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150);
    pdf.text(
      `Page ${i} / ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  pdf.save(`liste_${nomListe}.pdf`);
});

}
