import { LandingNav, LandingFooter } from '@/components/landing/chrome'

export const metadata = {
  title: 'Suppression de données | Raddlly',
  description: 'Instructions pour supprimer vos données personnelles de Raddlly.',
}

export default function SuppressionDonneesPage() {
  return (
    <>
      <LandingNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Suppression de données</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Votre droit à la suppression</h2>
            <p className="mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et aux autres lois applicables sur la protection des données,
              vous avez le droit de demander la suppression de vos données personnelles détenues par Raddlly.
            </p>
            <p className="mb-4">
              Ce droit, également appelé &quot;droit à l'oubli&quot;, vous permet de demander l'effacement de vos données personnelles
              dans certaines circonstances.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Quelles données sont concernées ?</h2>
            <p className="mb-4">La suppression peut concerner :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Données de compte :</strong> nom, email, photo de profil, informations de connexion</li>
              <li><strong>Données d'utilisation :</strong> flux d'automatisation, campagnes, conversations, contacts</li>
              <li><strong>Données de configuration :</strong> paramètres, préférences, intégrations</li>
              <li><strong>Données d'analyse :</strong> statistiques d'utilisation et métriques</li>
              <li><strong>Données de support :</strong> historique de tickets et communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Méthodes de suppression</h2>

            <h3 className="text-xl font-medium mb-3">3.1 Suppression depuis votre compte</h3>
            <p className="mb-4">Pour supprimer votre compte et vos données directement :</p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li>Connectez-vous à votre compte Raddlly</li>
              <li>Accédez à <strong>Paramètres → Compte</strong></li>
              <li>Faites défiler jusqu'à <strong>Zone de danger</strong></li>
              <li>Cliquez sur <strong>&quot;Supprimer mon compte&quot;</strong></li>
              <li>Confirmez la suppression en suivant les instructions</li>
              <li>Vous recevrez un email de confirmation une fois la suppression effectuée</li>
            </ol>

            <h3 className="text-xl font-medium mb-3">3.2 Demande par email</h3>
            <p className="mb-4">Si vous ne pouvez pas accéder à votre compte, envoyez une demande à :</p>
            <p className="mb-4">
              <strong>Email :</strong> <a href="mailto:rynaskebdi.pro@gmail.com" className="text-primary hover:underline">rynaskebdi.pro@gmail.com</a>
            </p>
            <p className="mb-4">Incluez dans votre demande :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Votre nom complet</li>
              <li>L'adresse email associée à votre compte</li>
              <li>La mention &quot;Demande de suppression de données RGPD&quot; dans l'objet</li>
              <li>Une pièce d'identité pour vérifier votre identité (si nécessaire)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">3.3 Suppression via Facebook</h3>
            <p className="mb-4">
              Si vous avez utilisé Raddlly via Facebook Messenger et souhaitez supprimer vos données liées à cette intégration :
            </p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li>Accédez à vos <strong>Paramètres Facebook → Applications et sites web</strong></li>
              <li>Recherchez <strong>Raddlly</strong> dans la liste</li>
              <li>Cliquez sur <strong>&quot;Supprimer&quot;</strong></li>
              <li>Cochez <strong>&quot;Supprimer les données de cette application&quot;</strong></li>
            </ol>
            <p className="mb-4">
              Vous pouvez également utiliser notre <a href="/data-deletion-callback" className="text-primary hover:underline">formulaire de suppression de données Facebook</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Délai de suppression</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Suppression immédiate :</strong> votre compte et l'accès au service sont désactivés immédiatement</li>
              <li><strong>Suppression des données actives :</strong> dans les 30 jours suivant la demande</li>
              <li><strong>Suppression des sauvegardes :</strong> dans les 90 jours suivant la demande</li>
              <li><strong>Confirmation :</strong> vous recevrez un email une fois la suppression complète effectuée</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Données conservées</h2>
            <p className="mb-4">
              Certaines données peuvent être conservées pour des raisons légales, fiscales ou de sécurité :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Données de facturation :</strong> conservées pendant 10 ans pour conformité fiscale</li>
              <li><strong>Logs de sécurité :</strong> conservés pendant 12 mois pour prévenir la fraude</li>
              <li><strong>Données agrégées et anonymisées :</strong> utilisées pour des analyses statistiques</li>
              <li><strong>Données requises par la loi :</strong> conservées selon les obligations légales applicables</li>
            </ul>
            <p className="mb-4">
              Ces données conservées sont stockées de manière sécurisée et ne sont pas utilisées pour vous identifier personnellement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Conséquences de la suppression</h2>
            <p className="mb-4">⚠️ <strong>Attention :</strong> La suppression de votre compte est irréversible. Une fois supprimé :</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Vous perdrez l'accès à tous vos flux d'automatisation, campagnes et conversations</li>
              <li>Tous vos contacts et segments seront définitivement supprimés</li>
              <li>Vos intégrations avec des services tiers seront déconnectées</li>
              <li>Votre historique de facturation restera accessible pendant 30 jours, puis sera archivé</li>
              <li>Vous ne pourrez pas récupérer ces données après suppression</li>
              <li>Les messages déjà envoyés à vos contacts via des plateformes tierces (Messenger, WhatsApp) ne seront pas supprimés</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Exporter vos données avant suppression</h2>
            <p className="mb-4">
              Nous vous recommandons fortement d'exporter vos données avant de demander leur suppression :
            </p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li>Connectez-vous à votre compte Raddlly</li>
              <li>Accédez à <strong>Paramètres → Données et confidentialité</strong></li>
              <li>Cliquez sur <strong>&quot;Télécharger mes données&quot;</strong></li>
              <li>Sélectionnez les données que vous souhaitez exporter</li>
              <li>Vous recevrez un email avec un lien de téléchargement sous 48 heures</li>
            </ol>
            <p className="mb-4">
              Les données exportées incluront : contacts, conversations, flux, campagnes, statistiques, et paramètres de compte.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Alternative : Désactivation temporaire</h2>
            <p className="mb-4">
              Si vous n'êtes pas certain de vouloir supprimer définitivement votre compte, vous pouvez le désactiver temporairement :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Votre compte et vos données seront préservés</li>
              <li>Vous ne serez plus facturé</li>
              <li>Vos flux et campagnes seront mis en pause</li>
              <li>Vous pourrez réactiver votre compte à tout moment</li>
            </ul>
            <p className="mb-4">
              Pour désactiver temporairement : <strong>Paramètres → Compte → Désactiver le compte</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Suppression partielle de données</h2>
            <p className="mb-4">
              Si vous ne souhaitez pas supprimer l'intégralité de votre compte, vous pouvez supprimer des données spécifiques :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Contacts :</strong> sélectionnez et supprimez des contacts individuels ou en masse</li>
              <li><strong>Conversations :</strong> supprimez l'historique de conversations spécifiques</li>
              <li><strong>Flux :</strong> supprimez des flux d'automatisation individuels</li>
              <li><strong>Campagnes :</strong> supprimez des campagnes terminées</li>
              <li><strong>Intégrations :</strong> déconnectez des intégrations tierces</li>
            </ul>
            <p className="mb-4">
              Ces suppressions partielles peuvent être effectuées directement depuis votre tableau de bord.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Vérification d'identité</h2>
            <p className="mb-4">
              Pour protéger votre compte contre les accès non autorisés, nous pouvons vous demander de vérifier votre identité
              avant de traiter votre demande de suppression. Cela peut inclure :
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Confirmation par email à l'adresse associée au compte</li>
              <li>Réponse à des questions de sécurité</li>
              <li>Présentation d'une pièce d'identité (pour les demandes par email)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Réclamations</h2>
            <p className="mb-4">
              Si vous n'êtes pas satisfait de la manière dont nous traitons votre demande de suppression, vous avez le droit de déposer
              une réclamation auprès de l'autorité de protection des données compétente :
            </p>
            <p className="mb-4">
              <strong>France :</strong> Commission Nationale de l'Informatique et des Libertés (CNIL)<br />
              Site web : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a><br />
              Adresse : 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Questions fréquentes</h2>

            <h3 className="text-xl font-medium mb-3">Q : Puis-je récupérer mon compte après suppression ?</h3>
            <p className="mb-4">
              Non, la suppression est définitive. Cependant, vous disposez d'un délai de grâce de 30 jours pendant lequel
              vous pouvez nous contacter pour annuler la suppression.
            </p>

            <h3 className="text-xl font-medium mb-3">Q : Que deviennent mes contacts après la suppression ?</h3>
            <p className="mb-4">
              Tous vos contacts et leurs données associées sont supprimés de notre système. Les messages déjà envoyés
              via Messenger, Instagram ou WhatsApp restent visibles pour vos contacts sur ces plateformes.
            </p>

            <h3 className="text-xl font-medium mb-3">Q : Mes données de facturation sont-elles supprimées ?</h3>
            <p className="mb-4">
              Les données de facturation sont conservées pendant 10 ans pour conformité fiscale, mais ne sont plus associées
              à votre profil personnel et sont stockées de manière anonymisée.
            </p>

            <h3 className="text-xl font-medium mb-3">Q : Combien de temps prend le traitement de ma demande ?</h3>
            <p className="mb-4">
              Nous traitons les demandes de suppression dans un délai maximum de 30 jours. Vous recevrez une confirmation
              par email une fois la suppression effectuée.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
            <p className="mb-4">
              Pour toute question concernant la suppression de vos données ou pour obtenir de l'aide :
            </p>
            <ul className="list-none pl-0 mb-4 space-y-2">
              <li><strong>Email :</strong> <a href="mailto:rynaskebdi.pro@gmail.com" className="text-primary hover:underline">rynaskebdi.pro@gmail.com</a></li>
              <li><strong>Délégué à la Protection des Données :</strong> <a href="mailto:rynaskebdi.pro@gmail.com" className="text-primary hover:underline">rynaskebdi.pro@gmail.com</a></li>
              <li><strong>Support :</strong> <a href="mailto:rynaskebdi.pro@gmail.com" className="text-primary hover:underline">rynaskebdi.pro@gmail.com</a></li>
            </ul>
          </section>
        </div>
      </div>
      <LandingFooter />
    </>
  )
}
