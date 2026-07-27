import { LandingNav, LandingFooter } from '@/components/landing/chrome'

export const metadata = {
  title: "Conditions d'utilisation | InstaFlow",
  description: "Conditions générales d'utilisation de InstaFlow - Les règles et conditions pour utiliser notre plateforme.",
}

export default function ConditionsUtilisationPage() {
  return (
    <>
      <LandingNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Conditions générales d'utilisation</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptation des conditions</h2>
            <p className="mb-4">
              En accédant et en utilisant InstaFlow (&quot;la Plateforme&quot;, &quot;le Service&quot;), vous acceptez d'être lié par ces 
              conditions générales d'utilisation (&quot;CGU&quot;). Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser 
              notre service.
            </p>
            <p className="mb-4">
              Ces CGU constituent un accord juridiquement contraignant entre vous (&quot;Utilisateur&quot;, &quot;vous&quot;) et InstaFlow 
              (&quot;nous&quot;, &quot;notre&quot;, &quot;la Société&quot;).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description du service</h2>
            <p className="mb-4">
              InstaFlow est une plateforme SaaS de marketing conversationnel et d'automatisation qui permet aux entreprises de :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Créer et gérer des conversations automatisées sur plusieurs canaux (Messenger, Instagram, WhatsApp, SMS)</li>
              <li>Automatiser le marketing et les ventes via des chatbots</li>
              <li>Gérer des contacts et des audiences</li>
              <li>Créer des campagnes marketing multicanal</li>
              <li>Intégrer avec des plateformes tierces (e-commerce, CRM, etc.)</li>
              <li>Analyser les performances et obtenir des insights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Création de compte et éligibilité</h2>
            <h3 className="text-xl font-medium mb-3">3.1 Éligibilité</h3>
            <p className="mb-4">
              Pour utiliser ManyChats, vous devez :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Avoir au moins 18 ans</li>
              <li>Avoir la capacité juridique de conclure un contrat contraignant</li>
              <li>Ne pas avoir été précédemment suspendu ou banni de la Plateforme</li>
              <li>Utiliser le Service conformément aux lois applicables</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">3.2 Informations de compte</h3>
            <p className="mb-4">
              Vous vous engagez à :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Fournir des informations exactes, complètes et à jour</li>
              <li>Maintenir la sécurité de votre mot de passe</li>
              <li>Ne pas partager votre compte avec des tiers</li>
              <li>Nous informer immédiatement de toute utilisation non autorisée</li>
              <li>Être responsable de toutes les activités sous votre compte</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Abonnements et paiements</h2>
            <h3 className="text-xl font-medium mb-3">4.1 Plans tarifaires</h3>
            <p className="mb-4">
              InstaFlow propose différents plans tarifaires avec des fonctionnalités et limites variées. 
              Les prix et fonctionnalités sont disponibles sur notre page de tarification et peuvent être modifiés avec un préavis de 30 jours.
            </p>

            <h3 className="text-xl font-medium mb-3">4.2 Facturation</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Les abonnements sont facturés à l'avance sur une base mensuelle ou annuelle</li>
              <li>Les paiements sont traités automatiquement à chaque période de facturation</li>
              <li>Tous les prix sont en euros (EUR) sauf indication contraire</li>
              <li>Les taxes applicables seront ajoutées selon votre localisation</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">4.3 Renouvellement automatique</h3>
            <p className="mb-4">
              Votre abonnement se renouvelle automatiquement à la fin de chaque période de facturation, 
              sauf si vous annulez avant la date de renouvellement. Vous pouvez annuler à tout moment depuis votre compte.
            </p>

            <h3 className="text-xl font-medium mb-3">4.4 Politique de remboursement</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Période d'essai gratuite : aucun frais jusqu'à l'expiration de la période d'essai</li>
              <li>Remboursement sous 14 jours : pour les nouveaux abonnements payants</li>
              <li>Pas de remboursement prorata en cas d'annulation en cours de période</li>
              <li>Le service reste accessible jusqu'à la fin de la période payée</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Utilisation acceptable</h2>
            <h3 className="text-xl font-medium mb-3">5.1 Usages autorisés</h3>
            <p className="mb-4">
              Vous pouvez utiliser InstaFlow pour des activités commerciales légitimes de marketing, ventes et support client.
            </p>

            <h3 className="text-xl font-medium mb-3">5.2 Usages interdits</h3>
            <p className="mb-4">Vous ne devez pas :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Envoyer du spam, du contenu non sollicité ou violer les lois anti-spam (CAN-SPAM, RGPD, etc.)</li>
              <li>Diffuser du contenu illégal, offensant, diffamatoire, pornographique ou haineux</li>
              <li>Usurper l'identité d'une personne ou d'une entité</li>
              <li>Violer les droits de propriété intellectuelle de tiers</li>
              <li>Tenter d'accéder à des systèmes ou données sans autorisation</li>
              <li>Utiliser le Service pour du phishing, des arnaques ou de la fraude</li>
              <li>Collecter des données d'utilisateurs sans leur consentement</li>
              <li>Interférer avec le fonctionnement de la Plateforme</li>
              <li>Utiliser des scripts, bots ou outils automatisés non autorisés</li>
              <li>Revendre ou redistribuer le Service sans autorisation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Contenu utilisateur</h2>
            <h3 className="text-xl font-medium mb-3">6.1 Propriété</h3>
            <p className="mb-4">
              Vous conservez tous les droits sur le contenu que vous créez et partagez via InstaFlow 
              (messages, flux, campagnes, médias, etc.).
            </p>

            <h3 className="text-xl font-medium mb-3">6.2 Licence accordée</h3>
            <p className="mb-4">
              En utilisant le Service, vous nous accordez une licence mondiale, non exclusive, libre de redevances 
              pour héberger, stocker, traiter et afficher votre contenu uniquement dans le but de fournir le Service.
            </p>

            <h3 className="text-xl font-medium mb-3">6.3 Responsabilité</h3>
            <p className="mb-4">
              Vous êtes seul responsable de votre contenu et devez vous assurer qu'il respecte toutes les lois applicables, 
              ces CGU et les politiques des plateformes tierces (Facebook, Instagram, WhatsApp).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Propriété intellectuelle</h2>
            <p className="mb-4">
              InstaFlow et tous ses éléments (code, design, logos, marques, documentation) sont notre propriété exclusive 
              ou celle de nos concédants de licence. Vous ne pouvez pas :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Copier, modifier ou créer des œuvres dérivées de la Plateforme</li>
              <li>Procéder à de la rétro-ingénierie ou tenter d'extraire le code source</li>
              <li>Utiliser nos marques sans autorisation écrite préalable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Intégrations tierces</h2>
            <p className="mb-4">
              InstaFlow s'intègre avec des services tiers (Facebook, Instagram, WhatsApp, Shopify, etc.). 
              Votre utilisation de ces intégrations est également soumise aux conditions d'utilisation de ces plateformes.
            </p>
            <p className="mb-4">
              Nous ne sommes pas responsables des changements, interruptions ou problèmes causés par ces services tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Garanties et responsabilité</h2>
            <h3 className="text-xl font-medium mb-3">9.1 Disponibilité du service</h3>
            <p className="mb-4">
              Nous nous efforçons de maintenir une disponibilité élevée du Service, mais nous ne garantissons pas 
              un fonctionnement ininterrompu ou sans erreur. Nous pouvons suspendre le Service pour maintenance 
              avec ou sans préavis.
            </p>

            <h3 className="text-xl font-medium mb-3">9.2 Limitation de responsabilité</h3>
            <p className="mb-4">
              Dans toute la mesure permise par la loi :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Le Service est fourni &quot;tel quel&quot; sans garantie d'aucune sorte</li>
              <li>Nous ne garantissons pas que le Service répondra à vos besoins spécifiques</li>
              <li>Notre responsabilité totale est limitée aux montants payés au cours des 12 derniers mois</li>
              <li>Nous ne sommes pas responsables des dommages indirects, accessoires ou consécutifs</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">9.3 Indemnisation</h3>
            <p className="mb-4">
              Vous acceptez de nous indemniser contre toute réclamation, perte ou dommage résultant de 
              votre utilisation du Service, de votre violation de ces CGU ou de votre violation des droits de tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Suspension et résiliation</h2>
            <h3 className="text-xl font-medium mb-3">10.1 Par vous</h3>
            <p className="mb-4">
              Vous pouvez résilier votre compte à tout moment depuis les paramètres. 
              La résiliation prend effet à la fin de votre période de facturation en cours.
            </p>

            <h3 className="text-xl font-medium mb-3">10.2 Par nous</h3>
            <p className="mb-4">
              Nous pouvons suspendre ou résilier votre accès immédiatement si :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Vous violez ces CGU</li>
              <li>Votre compte présente une activité suspecte ou frauduleuse</li>
              <li>Vous ne payez pas les frais dus</li>
              <li>Requis par la loi ou une décision de justice</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">10.3 Effets de la résiliation</h3>
            <p className="mb-4">
              Après résiliation :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Votre accès au Service sera immédiatement révoqué</li>
              <li>Vous pouvez télécharger vos données pendant 30 jours</li>
              <li>Nous supprimerons vos données conformément à notre politique de confidentialité</li>
              <li>Les clauses qui survivent naturellement à la résiliation restent en vigueur</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Modifications des CGU</h2>
            <p className="mb-4">
              Nous pouvons modifier ces CGU à tout moment. Les modifications significatives vous seront notifiées 
              par email ou via une notification sur la Plateforme au moins 30 jours à l'avance. 
              Votre utilisation continue du Service après l'entrée en vigueur des modifications constitue votre acceptation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Loi applicable et juridiction</h2>
            <p className="mb-4">
              Ces CGU sont régies par le droit français. Tout litige sera soumis à la juridiction exclusive 
              des tribunaux de Paris, France, sauf disposition légale contraire.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Dispositions générales</h2>
            <h3 className="text-xl font-medium mb-3">13.1 Intégralité de l'accord</h3>
            <p className="mb-4">
              Ces CGU, avec notre Politique de confidentialité, constituent l'intégralité de l'accord entre vous et InstaFlow.
            </p>

            <h3 className="text-xl font-medium mb-3">13.2 Divisibilité</h3>
            <p className="mb-4">
              Si une disposition est jugée invalide, les autres dispositions restent en vigueur.
            </p>

            <h3 className="text-xl font-medium mb-3">13.3 Renonciation</h3>
            <p className="mb-4">
              Le fait de ne pas exercer un droit ne constitue pas une renonciation à ce droit.
            </p>

            <h3 className="text-xl font-medium mb-3">13.4 Cession</h3>
            <p className="mb-4">
              Vous ne pouvez pas céder ces CGU sans notre consentement écrit. 
              Nous pouvons céder ces CGU sans restriction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact</h2>
            <p className="mb-4">
              Pour toute question concernant ces CGU, contactez-nous :
            </p>
            <ul className="list-none pl-0 mb-4 space-y-2">
              <li><strong>Email :</strong> <a href="mailto:rynaskebdi.pro@gmail.com" className="text-primary hover:underline">rynaskebdi.pro@gmail.com</a></li>
              <li><strong>Support :</strong> <a href="mailto:rynaskebdi.pro@gmail.com" className="text-primary hover:underline">rynaskebdi.pro@gmail.com</a></li>
              <li><strong>Adresse :</strong> InstaFlow, [Adresse complète]</li>
            </ul>
          </section>
        </div>
      </div>
      <LandingFooter />
    </>
  )
}
