import { HfInference } from "@huggingface/inference";
import promptText from '../prompt.txt?raw';

// Les constantes et l'initialisation du client sont maintenant ici
<<<<<<< HEAD
<<<<<<< HEAD
const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
=======
const HF_ACCESS_TOKEN = "exemple";
>>>>>>> d4fb0ca (hide token)
=======
const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
>>>>>>> b7646ea (hide token)
const hf = new HfInference(HF_ACCESS_TOKEN);

/**
 * Appelle l'API de Hugging Face pour obtenir un résumé d'une igit mage.
 * @param imageDataUrl L'image de la carte mentale encodée en base64 (data URL).
 * @returns Une promesse résolue avec le résumé textuel.
 */
export const getImageSummary = async (imageDataUrl: string): Promise<string | undefined> => {
  try {
    const response = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-VL-72B-Instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            { type: "image_url", image_url: { url: imageDataUrl } }
          ]
        }
      ],
      max_tokens: 2000,
    });
    
    // On retourne directement le contenu du message
    return response.choices[0].message.content;

  } catch (error) {
    console.error("Erreur lors de l'appel à l'IA:", error);
    // On retourne un message d'erreur clair qui sera affiché dans le PDF
    return "## Erreur de Génération\n\nLe service d'analyse d'image n'a pas pu traiter la demande. Veuillez vérifier votre connexion ou la console pour plus de détails techniques.";
  }
};