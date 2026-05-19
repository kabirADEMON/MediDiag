/**
 * Consultation Page
 * Main diagnostic consultation interface
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Stethoscope, Activity, Loader2, AlertCircle, Search, Save, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Autocomplete } from '@/components/ui/Autocomplete'
import { diagnosticSchema } from '@/utils/validators'
import { getUrgencyColor, formatScore, calculateAge } from '@/utils/helpers'
import { useAuth } from '@/context/AuthContext'
import * as diagnosticApi from '@/api/diagnosticApi'
import * as metadataApi from '@/api/metadataApi'
import * as patientApi from '@/api/patientApi'
import * as consultationApi from '@/api/consultationApi'

export function Consultation() {
  const { user } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [symptoms, setSymptoms] = useState([])
  const [analyses, setAnalyses] = useState({})

  // Save consultation state
  const [savingConsultation, setSavingConsultation] = useState(false)
  const [consultationSaved, setConsultationSaved] = useState(false)
  const [consultationNotes, setConsultationNotes] = useState('')
  const [recommendedAnalyses, setRecommendedAnalyses] = useState([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)

  // Patient selection
  const [patientCode, setPatientCode] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [searchingPatient, setSearchingPatient] = useState(false)
  const [patientError, setPatientError] = useState('')

  // Autocomplete data
  const [symptomsSuggestions, setSymptomsSuggestions] = useState([])
  const [analysesSuggestions, setAnalysesSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm({
    resolver: zodResolver(diagnosticSchema),
    defaultValues: {
      age: 0,
      sexe: 'M',
      symptomes: [],
      analyses: {},
    },
  })

  // Load suggestions and handle navigation state on mount
  useEffect(() => {
    loadSuggestions()

    // Auto-fill patient code from navigation state (e.g. from PatientDetails)
    const navState = location.state
    if (navState?.patientCode) {
      setPatientCode(navState.patientCode)
    }
  }, [])

  // Auto-search when patient code comes from navigation
  useEffect(() => {
    if (patientCode && location.state?.patientCode === patientCode) {
      searchPatientByCode()
    }
  }, [patientCode])

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true)

      const [symptomsResponse, analysesResponse] = await Promise.all([
        metadataApi.getSymptoms(),
        metadataApi.getAnalyses(),
      ])

      if (symptomsResponse.success && symptomsResponse.data) {
        const backendData = symptomsResponse.data.data || symptomsResponse.data
        setSymptomsSuggestions(backendData.symptoms || [])
      }

      if (analysesResponse.success && analysesResponse.data) {
        const backendData = analysesResponse.data.data || analysesResponse.data
        const analysesList = backendData.analyses || []
        setAnalysesSuggestions(Array.isArray(analysesList) ? analysesList : [])
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const searchPatientByCode = async () => {
    if (!patientCode.trim()) {
      setPatientError('Veuillez entrer un code patient')
      return
    }

    try {
      setSearchingPatient(true)
      setPatientError('')

      const response = await patientApi.getPatientByCode(patientCode.trim())

      if (response.success && response.data) {
        const patient = response.data.data || response.data
        if (patient?.id) {
          setSelectedPatient(patient)
          const age = calculateAge(patient.date_naissance)
          setValue('age', age)
          setValue('sexe', patient.sexe)
          setPatientError('')
        } else {
          setPatientError('Patient non trouvé avec ce code')
          setSelectedPatient(null)
        }
      } else {
        setPatientError('Patient non trouvé avec ce code')
        setSelectedPatient(null)
      }
    } catch (err) {
      console.error('Failed to search patient:', err)
      setPatientError('Patient non trouvé ou erreur lors de la recherche')
      setSelectedPatient(null)
    } finally {
      setSearchingPatient(false)
    }
  }

  const clearPatientSelection = () => {
    setPatientCode('')
    setSelectedPatient(null)
    setPatientError('')
    setValue('age', 0)
    setValue('sexe', 'M')
  }

  const addSymptom = (symptom) => {
    if (symptom && !symptoms.includes(symptom)) {
      const newSymptoms = [...symptoms, symptom]
      setSymptoms(newSymptoms)
      setValue('symptomes', newSymptoms)
    }
  }

  const removeSymptom = (symptom) => {
    const newSymptoms = symptoms.filter((s) => s !== symptom)
    setSymptoms(newSymptoms)
    setValue('symptomes', newSymptoms)
  }

  const addAnalysis = (analysisWithResult) => {
    if (analysisWithResult && !analyses[analysisWithResult]) {
      setAnalyses({ ...analyses, [analysisWithResult]: 1 })
    }
  }

  const removeAnalysis = (analysisName) => {
    const newAnalyses = { ...analyses }
    delete newAnalyses[analysisName]
    setAnalyses(newAnalyses)
    setValue('analyses', newAnalyses)
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setError('')
      setResults(null)
      setRecommendedAnalyses([])
      setShowRecommendations(false)
      setConsultationSaved(false)

      const response = await diagnosticApi.performDiagnostic({
        age: Number(data.age),
        sexe: data.sexe,
        symptomes: symptoms,
        analyses: analyses,
      })

      if (response.success) {
        const backendData = response.data.data || response.data
        setResults(backendData)

        if (Object.keys(analyses).length === 0) {
          setShowRecommendations(true)
        }
      } else {
        setError(response.error || 'Échec du diagnostic')
      }
    } catch (err) {
      setError('Une erreur est survenue lors du diagnostic')
      console.error('Diagnostic error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendedAnalyses = async () => {
    try {
      setLoadingRecommendations(true)
      setError('')

      const formValues = getValues()
      const currentAge = selectedPatient
        ? calculateAge(selectedPatient.date_naissance)
        : Number(formValues.age) || 0
      const currentSexe = formValues.sexe || 'M'

      const response = await diagnosticApi.getRecommendedExaminations({
        age: currentAge,
        sexe: currentSexe,
        symptomes: symptoms,
        analyses: {},
      })

      if (response.success && response.data) {
        const backendData = response.data.data || response.data
        setRecommendedAnalyses(backendData.analyses || [])
      } else {
        setError('Impossible de générer les analyses recommandées')
      }
    } catch (err) {
      console.error('Error generating recommendations:', err)
      setError('Erreur lors de la génération des recommandations')
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const addRecommendedAnalysis = (analysisName) => {
    if (!analyses[analysisName]) {
      setAnalyses({ ...analyses, [analysisName]: 1 })
    }
  }

  const saveConsultation = async () => {
    if (!selectedPatient) {
      setError("Veuillez sélectionner un patient avant d'enregistrer la consultation")
      return
    }

    if (!results || !results.diagnostics || results.diagnostics.length === 0) {
      setError('Aucun diagnostic à enregistrer')
      return
    }

    try {
      setSavingConsultation(true)
      setError('')

      const consultationData = {
        patient_id: selectedPatient.id,
        medecin_id: user?.id || 1,
        motif: 'Consultation médicale',
        symptomes: symptoms,
        analyses: analyses,
        diagnostic_results: results.diagnostics,
        notes: consultationNotes,
      }

      const response = await consultationApi.createConsultation(consultationData)

      if (response.success) {
        setConsultationSaved(true)
        setConsultationNotes('')
        setTimeout(() => setConsultationSaved(false), 6000)
      } else {
        setError(response.error || "Erreur lors de l'enregistrement de la consultation")
      }
    } catch (err) {
      console.error('Error saving consultation:', err)
      setError("Erreur lors de l'enregistrement de la consultation")
    } finally {
      setSavingConsultation(false)
    }
  }

  const diagnosticsList = results?.diagnostics || results?.data?.diagnostics || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Consultation médicale</h1>
        <p className="text-gray-600 mt-1">Effectuez un diagnostic intelligent</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <div className="space-y-6">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Sélection du patient (optionnel)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label="Code patient"
                      placeholder="PAT-20260510-0001"
                      value={patientCode}
                      onChange={(e) => setPatientCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchPatientByCode()}
                      disabled={searchingPatient || !!selectedPatient}
                    />
                  </div>
                  {!selectedPatient ? (
                    <Button
                      variant="primary"
                      onClick={searchPatientByCode}
                      loading={searchingPatient}
                      disabled={searchingPatient || !patientCode.trim()}
                      className="mt-6"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={clearPatientSelection}
                      className="mt-6"
                    >
                      Changer
                    </Button>
                  )}
                </div>

                {patientError && (
                  <Alert variant="error" onClose={() => setPatientError('')}>
                    {patientError}
                  </Alert>
                )}

                {selectedPatient && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-green-900">
                          {selectedPatient.prenom} {selectedPatient.nom}
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Code : {selectedPatient.code_patient}
                        </p>
                        <p className="text-sm text-green-700">
                          Âge : {calculateAge(selectedPatient.date_naissance)} ans •{' '}
                          {selectedPatient.sexe === 'M' ? 'Masculin' : 'Féminin'}
                        </p>
                        {selectedPatient.antecedents_medicaux && (
                          <p className="text-sm text-green-700 mt-1">
                            Antécédents : {selectedPatient.antecedents_medicaux}
                          </p>
                        )}
                        {selectedPatient.allergies && (
                          <p className="text-sm text-red-700 mt-1 font-medium">
                            ⚠️ Allergies : {selectedPatient.allergies}
                          </p>
                        )}
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patient info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations patient</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Âge"
                  type="number"
                  placeholder="28"
                  error={errors.age?.message}
                  required
                  disabled={!!selectedPatient}
                  {...register('age', { valueAsNumber: true })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexe <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="M"
                        {...register('sexe')}
                        disabled={!!selectedPatient}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="ml-2">Masculin</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="F"
                        {...register('sexe')}
                        disabled={!!selectedPatient}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="ml-2">Féminin</span>
                    </label>
                  </div>
                  {errors.sexe && (
                    <p className="mt-1 text-sm text-red-600">{errors.sexe.message}</p>
                  )}
                </div>

                {selectedPatient && (
                  <p className="text-sm text-gray-500 italic">
                    Informations remplies automatiquement depuis le dossier patient
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Symptoms */}
          <Card>
            <CardHeader>
              <CardTitle>
                Symptômes{' '}
                {symptoms.length > 0 && (
                  <span className="text-primary-600 font-normal">({symptoms.length})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Autocomplete
                  label="Ajouter un symptôme"
                  placeholder="Rechercher un symptôme..."
                  suggestions={symptomsSuggestions}
                  onSelect={addSymptom}
                  loading={loadingSuggestions}
                  helperText={`${symptomsSuggestions.length} symptômes disponibles — tapez pour rechercher ou appuyez sur Entrée`}
                />

                {symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {symptoms.map((symptom) => (
                      <Badge
                        key={symptom}
                        variant="info"
                        className="cursor-pointer hover:bg-red-100 hover:text-red-800 px-3 py-1 transition-colors"
                        onClick={() => removeSymptom(symptom)}
                        title="Cliquer pour supprimer"
                      >
                        {symptom} ×
                      </Badge>
                    ))}
                  </div>
                )}

                {errors.symptomes && (
                  <p className="text-sm text-red-600">{errors.symptomes.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analyses */}
          <Card>
            <CardHeader>
              <CardTitle>Analyses biologiques (optionnel)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Autocomplete
                  label="Ajouter une analyse"
                  placeholder="Rechercher une analyse..."
                  suggestions={analysesSuggestions}
                  onSelect={addAnalysis}
                  loading={loadingSuggestions}
                  helperText="Format : Analyse: Résultat attendu"
                />

                {Object.keys(analyses).length > 0 && (
                  <div className="space-y-2">
                    {Object.keys(analyses).map((analysisWithResult) => (
                      <div
                        key={analysisWithResult}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-900 flex-1">
                          {analysisWithResult}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAnalysis(analysisWithResult)}
                          className="ml-2 px-2 py-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
            disabled={loading || symptoms.length === 0}
            onClick={handleSubmit(onSubmit)}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Stethoscope className="w-4 h-4" />
                Lancer le diagnostic ({symptoms.length} symptôme{symptoms.length > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        <div>
          {results ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Résultats du diagnostic
                  {diagnosticsList.length > 0 && (
                    <span className="text-gray-500 font-normal ml-2">
                      ({diagnosticsList.length} correspondance{diagnosticsList.length > 1 ? 's' : ''})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {diagnosticsList.length > 0 ? (
                    diagnosticsList.map((diagnostic, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${getUrgencyColor(diagnostic.urgence)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <span className="text-xs font-bold bg-primary-600 text-white px-2 py-0.5 rounded">
                                Principal
                              </span>
                            )}
                            <h3 className="font-semibold text-lg">{diagnostic.maladie}</h3>
                          </div>
                          <Badge
                            variant={
                              diagnostic.score >= 80
                                ? 'danger'
                                : diagnostic.score >= 60
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {formatScore(diagnostic.score)}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">Urgence :</span>
                            <span className="capitalize">{diagnostic.urgence}</span>
                          </div>

                          {diagnostic.examens_recommandes?.length > 0 && (
                            <div>
                              <p className="font-medium mb-1">Examens recommandés :</p>
                              <ul className="list-disc list-inside space-y-1 text-xs">
                                {diagnostic.examens_recommandes.slice(0, 5).map((examen, i) => (
                                  <li key={i}>{examen}</li>
                                ))}
                                {diagnostic.examens_recommandes.length > 5 && (
                                  <li className="text-gray-500">
                                    +{diagnostic.examens_recommandes.length - 5} autres...
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>Aucun diagnostic correspondant trouvé</p>
                      <p className="text-sm mt-1">Essayez d'ajouter plus de symptômes</p>
                    </div>
                  )}
                </div>

                <Alert variant="warning" className="mt-4">
                  <p className="text-sm">
                    ⚠️ Ces résultats sont une aide à la décision. Toujours consulter un
                    professionnel de santé.
                  </p>
                </Alert>

                {/* Save consultation section */}
                {selectedPatient && !consultationSaved && diagnosticsList.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-lg mb-3">Enregistrer la consultation</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes complémentaires (optionnel)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          rows="3"
                          placeholder="Ajoutez des notes sur la consultation..."
                          value={consultationNotes}
                          onChange={(e) => setConsultationNotes(e.target.value)}
                        />
                      </div>

                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={saveConsultation}
                        loading={savingConsultation}
                        disabled={savingConsultation}
                      >
                        {savingConsultation ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Enregistrer dans le dossier de {selectedPatient.prenom}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {!selectedPatient && diagnosticsList.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 Sélectionnez un patient pour enregistrer cette consultation dans son dossier
                    </p>
                  </div>
                )}

                {/* Consultation saved confirmation */}
                {consultationSaved && (
                  <Alert variant="success" className="mt-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Consultation enregistrée !</p>
                        <p className="text-sm mt-1">
                          Consultation ajoutée au dossier de {selectedPatient?.prenom}{' '}
                          {selectedPatient?.nom}
                        </p>
                      </div>
                    </div>
                  </Alert>
                )}

                {/* Recommended analyses button */}
                {showRecommendations && Object.keys(analyses).length === 0 && (
                  <div className="mt-6">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={generateRecommendedAnalyses}
                      loading={loadingRecommendations}
                      disabled={loadingRecommendations}
                    >
                      {loadingRecommendations ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        'Générer les analyses recommandées'
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Le système suggèrera les analyses biologiques les plus pertinentes
                    </p>
                  </div>
                )}

                {/* Recommended analyses list */}
                {recommendedAnalyses.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-3">
                      Analyses recommandées ({recommendedAnalyses.length})
                    </h3>
                    <div className="space-y-2">
                      {recommendedAnalyses.map((analysis, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{analysis.name}</p>
                            <p className="text-sm text-gray-600">
                              Recommandée par {analysis.recommended_by} maladie(s) •{' '}
                              Priorité :{' '}
                              <span
                                className={`font-medium ${
                                  analysis.priority === 'high'
                                    ? 'text-red-600'
                                    : analysis.priority === 'medium'
                                    ? 'text-orange-600'
                                    : 'text-blue-600'
                                }`}
                              >
                                {analysis.priority === 'high'
                                  ? 'Haute'
                                  : analysis.priority === 'medium'
                                  ? 'Moyenne'
                                  : 'Basse'}
                              </span>
                            </p>
                            {analysis.diseases?.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Pour : {analysis.diseases.join(', ')}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => addRecommendedAnalysis(analysis.name)}
                            disabled={!!analyses[analysis.name]}
                          >
                            {analyses[analysis.name] ? '✓ Ajoutée' : 'Ajouter'}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Alert variant="info" className="mt-4">
                      <p className="text-sm">
                        Ajoutez les analyses souhaitées puis relancez le diagnostic pour affiner les résultats.
                      </p>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <Activity className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  Prêt pour le diagnostic
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Remplissez les informations du patient et ajoutez au moins un symptôme pour lancer
                  l'analyse
                </p>
                <div className="mt-6 text-sm text-gray-400 space-y-1">
                  <p>Base : 1000 maladies référencées</p>
                  <p>Algorithme hybride ML + Fuzzy matching</p>
                  <p>Précision : 90.7%</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Consultation
