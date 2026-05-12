/**
 * Settings Page
 * Application settings and preferences
 */

import { Settings as SettingsIcon, User, Bell, Shield, Database } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

export function Settings() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Gérez vos préférences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profil utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Nom</p>
              <p className="font-medium">
                {user?.prenom} {user?.nom}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rôle</p>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
            <Button variant="primary">Modifier le profil</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between">
              <span>Notifications par email</span>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span>Alertes diagnostics</span>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span>Rappels consultations</span>
              <input type="checkbox" className="w-4 h-4" />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="secondary" className="w-full">
              Changer le mot de passe
            </Button>
            <Button variant="secondary" className="w-full">
              Authentification à deux facteurs
            </Button>
            <Button variant="danger" className="w-full">
              Déconnexion de tous les appareils
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Base de données</p>
              <p className="font-medium">1000 maladies chargées</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Modèle IA</p>
              <p className="font-medium">Random Forest (90.7% précision)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Settings
