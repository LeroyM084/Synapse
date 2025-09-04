import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';

// Constantes pour la mise en page
const PRIMARY_COLOR = '#ff9100'; // Orange Synapse
const TEXT_COLOR = '#333333';
const FOOTER_TEXT = 'Généré par Synapse - 2025';

/**
 * Ajoute un pied de page standard à une page du PDF.
 */
const addFooter = (pdf: jsPDF) => {
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(8);
  pdf.setTextColor('#888888');
  pdf.text(FOOTER_TEXT, pdf.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
};

/**
 * Génère un document PDF complet à partir de la carte mentale et du résumé de l'IA.
 * @param canvasElement L'élément DOM du canevas de la carte mentale.
 * @param summaryText Le texte du résumé généré par l'IA (au format Markdown).
 */
export const generatePdf = async (
  canvasElement: HTMLDivElement,
  summaryText: string
) => {
  try {
    // Initialisation du document PDF avec les dimensions du canevas
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvasElement.offsetWidth, canvasElement.offsetHeight],
    });

    // --- PAGE 1 : LA CARTE MENTALE ---
    
    // Titre de la page
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(PRIMARY_COLOR);
    pdf.text('Votre Carte Mentale Synapse', pdf.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    
    // Capture de la carte mentale
    const canvasImage = await html2canvas(canvasElement, { useCORS: true });
    pdf.addImage(
      canvasImage.toDataURL('image/png'),
      'PNG',
      40, // Marge à gauche
      60, // Marge en haut
      canvasElement.offsetWidth - 80, // Largeur avec marges
      canvasElement.offsetHeight - 100 // Hauteur avec marges
    );
    addFooter(pdf);

    // --- PAGE 2 : LE RÉSUMÉ DE L'IA ---
    pdf.addPage();
    
    // Titre de la page
    pdf.text("Analyse et Vérification par l'IA", pdf.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    
    // Conversion du Markdown en HTML
    const summaryHtml = await marked.parse(summaryText);

    // Création d'un conteneur temporaire et stylisé pour le rendu HTML
    const summaryContainer = document.createElement('div');
    summaryContainer.innerHTML = summaryHtml;
    Object.assign(summaryContainer.style, {
      position: 'absolute',
      left: '-9999px',
      width: `${canvasElement.offsetWidth - 80}px`,
      padding: '20px',
      backgroundColor: '#f9f9f9',
      color: TEXT_COLOR,
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: '12px',
      border: `2px solid ${PRIMARY_COLOR}`,
      borderRadius: '8px',
    });
    document.body.appendChild(summaryContainer);

    // Capture du résumé mis en page
    const summaryImage = await html2canvas(summaryContainer);
    pdf.addImage(
      summaryImage.toDataURL('image/png'),
      'PNG',
      40, // Marge
      60, // Marge
      canvasElement.offsetWidth - 80,
      0 // Hauteur automatique
    );
    document.body.removeChild(summaryContainer); // Nettoyage
    addFooter(pdf);

    // --- TÉLÉCHARGEMENT ---
    pdf.save('Synapse_Export.pdf');

  } catch (err) {
    console.error("Erreur lors de la génération du PDF :", err);
    alert("Une erreur est survenue lors de la création du PDF.");
  }
};