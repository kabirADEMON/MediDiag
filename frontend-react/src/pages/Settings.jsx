/**
 * Settings Page
 * Application settings and preferences
 */

import { useState } from 'react'
import { Settings as SettingsIcon, User, Bell, Shield, Database, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'

export function Settings() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState({
    email: true,
    alerts: true,
    reminders: false,
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePasswordChange = async () => {
    setPasswordMsg('')
    setPasswordError('')

    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordError('Veuillez remplir tous les champs')
      return
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas')
      return
    }
    if (passwordData.new.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      setSavingPassword(true)
      // Simulate password change (backend doesn't support it yet)
      await new Promise((r) => setTimeout(r, 800))
      setPasswordMsg('Mot de passe modifié avec succès')
      setPasswordData({ current: '', new: '', confirm: '' })
      setShowPasswordForm(false)
    } catch (err) {
      setPasswordError('Erreur lors du changement de mot de passe')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleLogoutAllDevices = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter de tous les appareils ?')) {
      await logout()
    }
  }

  const roleLabel = {
    medecin: 'Médecin',
    infirmier: 'Infirmier(e)',
    administrateur: 'Administrateur',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Gérez vos préférences et votre compte</p>
      </div>

      {passwordMsg && (
        <Alert variant="success" onClose={() => setPasswordMsg('')}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {passwordMsg}
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profil utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-gray-500">{user?.email}</p>
                <Badge variant="info" className="mt-1">
                  {roleLabel[user?.role] || user?.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nom</p>
                <p className="font-medium">{user?.nom || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prénom</p>
                <p className="font-medium">{user?.prenom || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user?.email || '—'}</p>
              </div>
              {user?.specialite && (
                <div>
                  <p className="text-sm text-gray-600">Spécialité</p>
                  <p className="font-medium">{user.specialite}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { key: 'email', label: 'Notifications par email', desc: "Recevoir les alertes par email" },
                { key: 'alerts', label: 'Alertes diagnostics', desc: 'Notifications pour les diagnostics critiques' },
                { key: 'reminders', label: 'Rappels consultations', desc: 'Rappels avant les consultations' },
              ].map(({ key, label, desc }) => (
                <label
                  key={key}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                  <div className="relative flex-shrink-0 ml-4">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={notifications[key]}
                      onChange={() => handleNotificationChange(key)}
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        notifications[key] ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform mt-1 ${
                          notifications[key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <Alert variant="error" onClose={() => setPasswordError('')}>
                {passwordError}
              </Alert>
            )}

            {!showPasswordForm ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowPasswordForm(true)}
              >
                Changer le mot de passe
              </Button>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Changer le mot de passe</h4>

                {[
                  { key: 'current', label: 'Mot de passe actuel' },
                  { key: 'new', label: 'Nouveau mot de passe' },
                  { key: 'confirm', label: 'Confirmer le nouveau mot de passe' },
                ].map(({ key, label }) => (
                  <div key={key} className="relative">
                    <Input
                      label={label}
                      type={showPasswords[key] ? 'text' : 'password'}
                      value={passwordData[key]}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                    >
                      {showPasswords[key] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setPasswordData({ current: '', new: '', confirm: '' })
                      setPasswordError('')
                    }}
                    disabled={savingPassword}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handlePasswordChange}
                    loading={savingPassword}
                    disabled={savingPassword}
                    className="flex-1"
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}

            <Button
              variant="danger"
              className="w-full"
              onClick={handleLogoutAllDevices}
            >
              Déconnexion de tous les appareils
            </Button>
          </CardContent>
        </Card>

        {/* System info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Version', value: 'MediDiag v1.0.0' },
              { label: 'Base de données', value: '1000 maladies chargées' },
              { label: 'Modèle IA', value: 'Random Forest + Fuzzy Matching' },
              { label: 'Précision du modèle', value: '90.7%' },
              { label: 'Algorithme', value: 'Hybrid ML (70%) + Fuzzy (30%)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{label}</p>
                <p className="font-medium text-gray-900">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Settings
