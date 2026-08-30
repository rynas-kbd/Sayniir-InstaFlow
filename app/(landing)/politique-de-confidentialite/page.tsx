import { LandingNav, LandingFooter } from '@/components/landing/chrome'

export const metadata = {
  title: 'Politique de confidentialité | Raddlly',
  description: 'Politique de confidentialité de Raddlly - Comment nous collectons, utilisons et protégeons vos données personnelles.',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <LandingNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Politique de confidentialité</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Bienvenue sur Raddlly. Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles.
              Cette politique de confidentialité vous informe sur la manière dont nous traitons vos données personnelles lorsque vous
              utilisez notre plateforme de marketing conversationnel et d'automatisation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Données que nous collectons</h2>
            <h3 className="text-xl font-medium mb-3">2.1 Données d'identification</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Identifiants de compte</li>
              <li>Photo de profil</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.2 Données de connexion</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Adresse IP</li>
              <li>Type de navigateur et version</li>
              <li>Fuseau horaire et localisation</li>
              <li>Logs de connexion</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.3 Données d'utilisation</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Historique des conversations</li>
              <li>Flux d'automatisation créés</li>
              <li>Campagnes marketing</li>
              <li>Contacts et segments</li>
              <li>Métriques et analyses d'utilisation</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.4 Données de paiement</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Informations de facturation (traitées par nos prestataires de paiement sécurisés)</li>
              <li>Historique des transactions</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.5 Données des intégrations tierces</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Données provenant de Facebook Messenger, Instagram, WhatsApp</li>
              <li>Données de vos intégrations (Shopify, WooCommerce, etc.)</li>
              <li>Données CRM et marketing automation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Comment nous utilisons vos données</h2>
            <p className="mb-4">Nous utilisons vos données personnelles pour :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Fournir et maintenir nos services</li>
              <li>Gérer votre compte et vos abonnements</li>
              <li>Traiter vos paiements</li>
              <li>Vous envoyer des notifications importantes concernant le service</li>
              <li>Améliorer nos services et développer de nouvelles fonctionnalités</li>
              <li>Assurer la sécurité et prévenir la fraude</li>
              <li>Respecter nos obligations légales</li>
              <li>Vous envoyer des communications marketing (avec votre consentement)</li>
              <li>Fournir un support client</li>
              <li>Analyser l'utilisation de la plateforme pour optimiser l'expérience utilisateur</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Base légale du traitement</h2>
            <p className="mb-4">Nous traitons vos données personnelles sur les bases légales suivantes :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Exécution du contrat :</strong> pour fournir les services que vous avez demandés</li>
              <li><strong>Consentement :</strong> pour les communications marketing et certaines fonctionnalités optionnelles</li>
              <li><strong>Intérêt légitime :</strong> pour améliorer nos services, assurer la sécurité et prévenir la fraude</li>
              <li><strong>Obligations légales :</strong> pour respecter les lois et réglementations applicables</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Partage de vos données</h2>
            <p className="mb-4">Nous pouvons partager vos données avec :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Prestataires de services :</strong> hébergement, paiement, analyse, support client</li>
              <li><strong>Plateformes tierces :</strong> Facebook, Instagram, WhatsApp (selon vos intégrations)</li>
              <li><strong>Autorités légales :</strong> si requis par la loi ou pour protéger nos droits</li>
              <li><strong>Partenaires commerciaux :</strong> avec votre consentement explicite</li>
            </ul>
            <p className="mb-4">
              Nous ne vendons jamais vos données personnelles à des tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Transferts internationaux de données</h2>
            <p className="mb-4">
              Vos données peuvent être transférées et stockées dans des pays en dehors de l'Union Européenne.
              Dans ce cas, nous nous assurons que des garanties appropriées sont en place conformément au RGPD,
              notamment par l'utilisation de clauses contractuelles types de l'UE ou d'autres mécanismes approuvés.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Sécurité des données</h2>
            <p className="mb-4">Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Chiffrement des données en transit (SSL/TLS) et au repos</li>
              <li>Authentification forte et contrôle d'accès</li>
              <li>Surveillance et détection des incidents de sécurité</li>
              <li>Audits de sécurité réguliers</li>
              <li>Formation du personnel sur la protection des données</li>
              <li>Processus de sauvegarde et de récupération</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Conservation des données</h2>
            <p className="mb-4">
              Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services
              et respecter nos obligations légales :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Données de compte :</strong> jusqu'à la suppression de votre compte + 30 jours</li>
              <li><strong>Données de facturation :</strong> conformément aux obligations fiscales (généralement 10 ans)</li>
              <li><strong>Données de conversation :</strong> selon votre configuration ou jusqu'à la suppression de votre compte</li>
              <li><strong>Logs de sécurité :</strong> 12 mois maximum</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Vos droits</h2>
            <p className="mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger les données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
              <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
              <li><strong>Droit de retirer le consentement :</strong> à tout moment, sans affecter la licéité du traitement antérieur</li>
              <li><strong>Droit de réclamation :</strong> déposer une plainte auprès de la CNIL</li>
            </ul>
            <p className="mb-4">
              Pour exercer ces droits, contactez-nous à : <a href="mailto:rynaskebdi.pro@gmail.com" className="text-primary hover:underline">rynaskebdi.pro@gmail.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Cookies et technologies similaires</h2>
            <p className="mb-4">
              Nous utilisons des cookies et technologies similaires pour améliorer votre expérience.
              Consultez notre politique de cookies pour plus d'informations sur les types de cookies utilisés
              et comment les gérer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Modifications de cette politique</h2>
            <p className="mb-4">
              Nous pouvons mettre à jour cette politique de confidentialité occasionnellement.
              Nous vous informerons de tout changement significatif par email ou via une notification sur la plateforme.
              La date de "dernière mise à jour" en haut de cette page indique quand cette politique a été révisée pour la dernière fois.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
            <p className="mb-4">
              Pour toute question concernant cette politique de confidentialité ou nos pratiques en matière de données,
              vous pouvez nous contacter :
            </p>
            <ul className="list-none pl-0 mb-4 space-y-2">
              <li><strong>Email :</strong> <a href="mailto:rynaskebdi.pro@gmail.com" className="text-primary hover:underline">rynaskebdi.pro@gmail.com</a></li>
              <li><strong>Délégué à la Protection des Données :</strong> <a href="mailto:rynaskebdi.pro@gmail.com" className="text-primary hover:underline">rynaskebdi.pro@gmail.com</a></li>
              <li><strong>Adresse postale :</strong> Raddlly, [Adresse complète]</li>
            </ul>
          </section>
        </div>
      </div>
      <LandingFooter />
    </>
  )
}
