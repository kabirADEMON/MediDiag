"""
Script to train the Machine Learning model
Run this script to train and save the ML model
"""
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.ml.train_model import train_and_save_model
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    """Train and save the ML model"""
    print("\n" + "="*60)
    print("🤖 ENTRAÎNEMENT DU MODÈLE MACHINE LEARNING")
    print("="*60)
    print()
    
    # Path to dataset
    csv_path = 'app/datasets/1000_Maladies_Complet_Age_Sexe.csv'
    
    if not Path(csv_path).exists():
        print(f"❌ Erreur: Dataset non trouvé à {csv_path}")
        return 1
    
    print(f"📊 Dataset: {csv_path}")
    print(f"🔧 Algorithme: Random Forest")
    print(f"📈 Vectorisation: TF-IDF")
    print()
    print("⏳ Entraînement en cours...")
    print()
    
    try:
        # Train model
        metrics = train_and_save_model(csv_path)
        
        print("\n" + "="*60)
        print("✅ ENTRAÎNEMENT TERMINÉ AVEC SUCCÈS!")
        print("="*60)
        print()
        print("📊 MÉTRIQUES DE PERFORMANCE:")
        print(f"   • Précision (Accuracy):     {metrics['accuracy']:.2%}")
        print(f"   • Top-3 Accuracy:           {metrics['top3_accuracy']:.2%}")
        print(f"   • Top-5 Accuracy:           {metrics['top5_accuracy']:.2%}")
        print(f"   • Cross-Validation:         {metrics['cv_mean']:.2%} (±{metrics['cv_std']:.2%})")
        print()
        print("📁 MODÈLE SAUVEGARDÉ:")
        print(f"   • Nombre de maladies:       {metrics['n_diseases']}")
        print(f"   • Exemples d'entraînement:  {metrics['n_training_samples']}")
        print(f"   • Features texte:           {metrics.get('n_text_features', 'N/A')}")
        print(f"   • Features totales:         {metrics.get('n_total_features', 'N/A')}")
        print(f"   • Inclut âge:               {metrics.get('includes_age', False)}")
        print(f"   • Inclut sexe:              {metrics.get('includes_sex', False)}")
        print(f"   • Inclut analyses:          {metrics.get('includes_analyses', False)}")
        print()
        print("🚀 Le modèle ML est maintenant prêt à être utilisé!")
        print("   Redémarrez le serveur FastAPI pour activer les prédictions ML.")
        print("="*60)
        print()
        
        return 0
        
    except Exception as e:
        print(f"\n❌ ERREUR lors de l'entraînement: {e}")
        logger.error(f"Training error: {e}", exc_info=True)
        return 1


if __name__ == '__main__':
    sys.exit(main())
