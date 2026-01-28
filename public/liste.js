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
  updateDoc,
  doc,
  serverTimestamp,
  where,
  getDocs
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
const adminmodify = document.getElementById("adminmodify");
const adminBtn = document.getElementById("adminBtn");
const downloadBtn = document.getElementById("downloadBtn");
const loading = document.getElementById("loading");
const personTable = document.getElementById("personTable");
const tableBody = document.getElementById("tableBody");
const emptyMessage = document.getElementById("emptyMessage");
const listNameSpan = document.getElementById("listName");
const changeListName = document.getElementById("changeListName");

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
    changeListName.style.display = "none";
    retirerIndicateurAdmin();
  } else {
    const password = prompt("Entrer le mot de passe admin");
    if (password === ADMIN_PASSWORD) {
      isAdminMode = true;
      adminBtn.textContent = "Quitter admin";
      downloadBtn.style.display = "inline-block";
      adminmodify.style.display = "inline-block";
      changeListName.style.display = "inline-block";
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
// VÉRIFICATION UNICITÉ MATRICULE
// ==============================
async function matriculeExiste(matricule, idExclu = null) {
  if (!matricule || matricule.trim() === "") {
    return false; // Matricule vide = pas d'unicité requise
  }
  const q = query(personnesRef, where("matricule", "==", matricule.trim()));
  const querySnapshot = await getDocs(q);
  
  // Exclure l'ID si fourni (pour la modification de la même personne)
  const docs = querySnapshot.docs.filter(d => d.id !== idExclu);
  return docs.length > 0;
}

// ==============================
// CHANGER NOM DE LISTE (MODE ADMIN)
// ==============================
window.changerNomListe = async function() {
  if (!isAdminMode) return alert("Mode admin requis");
  const ancienNom = toutesLesPersonnes[0]?.nomliste || "";
  const nouveauNom = prompt("Nouveau nom de liste :", ancienNom);
  
  if (!nouveauNom || nouveauNom.trim() === "" || nouveauNom === ancienNom) {
    return;
  }

  if (!confirm(`Changer le nom de liste de "${ancienNom}" à "${nouveauNom}" pour toutes les personnes ?`)) {
    return;
  }

  try {
    // Mettre à jour toutes les personnes avec le nouveau nom de liste
    for (const personne of toutesLesPersonnes) {
      await updateDoc(doc(db, "personnes", personne.id), {
        nomliste: nouveauNom.trim()
      });
    }
    
    // Mettre à jour le localStorage
    localStorage.setItem("nomliste", nouveauNom.trim());
    alert("✅ Nom de liste changé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du changement de nom de liste :", error);
    alert("Erreur lors du changement du nom de liste");
  }
}


/* changer son nom et prenom , matricule ou note si on constate qu'on s'est trompé sur l'information qu'on voulait entrer et qu'on est en mode admin
et on clique sur modifier rt on choisit la personne sur qui on a fait l'erreur ensuite on retourne sur le formulaire pour la corriger*/
adminmodify.addEventListener("click", async () => {
  if (!isAdminMode) return alert("Mode admin requis");
  const personneList = toutesLesPersonnes.map((p, index) => `${index + 1}. ${p.prenom} ${p.nom} (Matricule: ${p.matricule}, Note: ${p.Note})`).join("\n");
  const choix = prompt(`Choisissez la personne à modifier:\n${personneList}`);
  const index = parseInt(choix) - 1;
  if (isNaN(index) || index < 0 || index >= toutesLesPersonnes.length) {
    return alert("Choix invalide");
  }
  const personne = toutesLesPersonnes[index];
  const nouvelleNote = prompt("Nouvelle note :", personne.Note) || personne.Note;
  try {
    await updateDoc(doc(db, "personnes", personne.id), {
      Note: nouvelleNote
    });
    alert("✅ Note modifiée avec succès !");
  }
  catch (error) {
    console.error("❌ Erreur Firestore :", error);
    alert("Erreur lors de la modification");
  }
});

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
    
    toutesLesPersonnes.sort((a, b) =>
  a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" })
);
 
    listNameSpan.textContent = toutesLesPersonnes[0].nomliste;

    toutesLesPersonnes.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.nom}</td>
        <td>${p.prenom}</td>
        <td>${p.matricule}</td>
        <td>${p.Note}</td>
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
  pdf.setFillColor(255, 255, 255); // bleu moderne
  pdf.rect(0, 0, 210, 30, "F");

  pdf.setTextColor(0, 0, 0); // Pour que le texte soit noir;
  pdf.setFontSize(18);
  pdf.text("ECOLE NATIONALE SUPERIEURE POLYTECHNIQUE", 105, 14, { align: "center" });

  pdf.setFontSize(12);
  pdf.text(`Liste : ${nomListe}`, 105, 22, { align: "center" });

  // ======================
  // TABLEAU
  // ======================
  const tableData = toutesLesPersonnes.map(p => [
    p.nom,
    p.prenom,
    p.matricule,
    p.Note
  ]);

  pdf.autoTable({
    startY: 40,
    head: [["Nom", "Prénom", "Matricule", "Note"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 4,
      linewidth: 0.1,
      linecolor: [0, 0 ,0]
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontStyle: "bold",
      linewidth: 0.3,
      linecolor: [0, 0 ,0]
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
