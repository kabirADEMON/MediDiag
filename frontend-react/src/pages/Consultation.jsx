/**
 * Consultation Page
 * Main diagnostic consultation interface
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Stethoscope, Activity, Loader2, AlertCircle, Search, Save } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [symptoms, setSymptoms] = useState([])
  const [analyses, setAnalyses] = useState({})
  
  // Save consultation state
  const [savingConsultation, setSavingConsultation] = useState(false)
  const [consultationSaved, setConsultationSaved] = useState(false)
  const [consultationNotes, setConsultationNotes] = useState('')
  // Recommended analyses from first diagnostic
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
  const [analysesMetadata, setAnalysesMetadata] = useState({}) // Store metadata for each analysis
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

  // Load symptoms and analyses suggestions on mount
  useEffect(() => {
    console.log('🔄 Component mounted, loading suggestions...')
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true)
      console.log('📡 Fetching symptoms and analyses from API...')
      
      const [symptomsResponse, analysesResponse] = await Promise.all([
        metadataApi.getSymptoms(),
        metadataApi.getAnalyses(),
      ])

      console.log('📦 Raw Symptoms Response:', symptomsResponse)
      console.log('📦 Raw Analyses Response:', analysesResponse)

      if (symptomsResponse.success && symptomsResponse.data) {
        // symptomsResponse.data contient { success, data: { symptoms, total } }
        const backendData = symptomsResponse.data.data || symptomsResponse.data
        const symptoms = backendData.symptoms || []
        console.log('✅ Loaded symptoms:', symptoms.length, 'First 5:', symptoms.slice(0, 5))
        setSymptomsSuggestions(symptoms)
      } else {
        console.error('❌ Symptoms response not successful:', symptomsResponse)
      }

      if (analysesResponse.success && analysesResponse.data) {
        console.log('🔍 Analyses response data:', analysesResponse.data)
        const backendData = analysesResponse.data.data || analysesResponse.data
        console.log('🔍 Backend data:', backendData)
        const analyses = backendData.analyses || []
        console.log('🔍 Raw analyses array:', analyses, 'Length:', analyses.length)
        
        // Analyses are now strings in format "Analysis: Result" or just "Analysis"
        const suggestions = Array.isArray(analyses) ? analyses : []
        
        console.log('✅ Loaded analyses:', suggestions.length, 'First 5:', suggestions.slice(0, 5))
        setAnalysesSuggestions(suggestions)
        
        // No metadata needed since the result is in the string itself
        setAnalysesMetadata({})
      } else {
        console.error('❌ Analyses response not successful:', analysesResponse)
      }
    } catch (err) {
      console.error('❌ Failed to load suggestions:', err)
    } finally {
      setLoadingSuggestions(false)
      console.log('✅ Loading suggestions completed')
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
      
      // Search patient by code using dedicated endpoint
      const response = await patientApi.getPatientByCode(patientCode.trim())

      if (response.success && response.data?.data) {
        const patient = response.data.data
        setSelectedPatient(patient)
        
        // Auto-fill age and sex
        const age = calculateAge(patient.date_naissance)
        setValue('age', age) // Pas besoin de toString(), setValue gère la conversion
        setValue('sexe', patient.sexe)
        
        setPatientError('')
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
      // The string is already in format "Analysis: Result"
      // We store it as-is, with value 1 (to indicate it's selected)
      setAnalyses({ ...analyses, [analysisWithResult]: 1 })
    }
  }

  const updateAnalysisValue = (analysisName, value) => {
    const newAnalyses = { ...analyses, [analysisName]: parseFloat(value) || 0 }
    setAnalyses(newAnalyses)
    setValue('analyses', newAnalyses)
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

      console.log('📤 Sending diagnostic request:', {
        age: data.age,
        sexe: data.sexe,
        symptomes: symptoms,
        analyses: analyses,
      })

      const response = await diagnosticApi.performDiagnostic({
        age: Number(data.age), // S'assurer que c'est un number
        sexe: data.sexe,
        symptomes: symptoms,
        analyses: analyses,
      })

      console.log('📥 Diagnostic response:', response)

      if (response.success) {
        // Même structure de réponse que pour les patients
        const backendData = response.data.data || response.data
        setResults(backendData)
        
        // Show recommendations button if no analyses were provided
        if (Object.keys(analyses).length === 0) {
          setShowRecommendations(true)
        }
      } else {
        setError(response.error || 'Échec du diagnostic')
      }
    } catch (err) {
      setError('Une erreur est survenue lors du diagnostic')
      console.error('❌ Diagnostic error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateRecommendedAnalyses = async () => {
    try {
      setLoadingRecommendations(true)
      setError('')

      console.log('🔬 Generating recommended analyses...')

      // Get current form values
      const formValues = getValues()
      const currentAge = selectedPatient 
        ? calculateAge(selectedPatient.date_naissance) 
        : Number(formValues.age) || 0
      const currentSexe = formValues.sexe || 'M'

      console.log('📊 Request data:', { age: currentAge, sexe: currentSexe, symptoms: symptoms.length })

      const response = await diagnosticApi.getRecommendedExaminations({
        age: currentAge,
        sexe: currentSexe,
        symptomes: symptoms,
        analyses: {},
      })

      console.log('📋 Recommended analyses response:', response)

      if (response.success && response.data) {
        const backendData = response.data.data || response.data
        const analysesData = backendData.analyses || []
        console.log('✅ Recommended analyses:', analysesData.length)
        setRecommendedAnalyses(analysesData)
      } else {
        setError('Impossible de générer les analyses recommandées')
      }
    } catch (err) {
      console.error('❌ Error generating recommendations:', err)
      setError('Erreur lors de la génération des recommandations')
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const addRecommendedAnalysis = (analysisName) => {
    if (!analyses[analysisName]) {
      setAnalyses({ ...analyses, [analysisName]: '' })
    }
  }

  const saveConsultation = async () => {
    if (!selectedPatient) {
      setError('Veuillez sélectionner un patient avant d\'enregistrer la consultation')
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
        medecin_id: user?.id || 1, // Use logged-in user ID
        motif: 'Consultation médicale',
        symptomes: symptoms,
        analyses: analyses,
        diagnostic_results: results.diagnostics,
        notes: consultationNotes
      }

      console.log('💾 Saving consultation:', consultationData)

      const response = await consultationApi.createConsultation(consultationData)

      if (response.success) {
        setConsultationSaved(true)
        setError('')
        
        // Show success message
        setTimeout(() => {
          setConsultationSaved(false)
        }, 5000)
      } else {
        setError(response.error || 'Erreur lors de l\'enregistrement de la consultation')
      }
    } catch (err) {
      console.error('❌ Error saving consultation:', err)
      setError('Erreur lors de l\'enregistrement de la consultation')
    } finally {
      setSavingConsultation(false)
    }
  }

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
              <CardTitle>Sélection du patient</CardTitle>
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
                      disabled={searchingPatient}
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={searchPatientByCode}
                    loading={searchingPatient}
                    disabled={searchingPatient || !patientCode.trim()}
                    className="mt-6"
                  >
                    <Search className="w-4 h-4" />
                    Rechercher
                  </Button>
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
                          Code: {selectedPatient.code_patient}
                        </p>
                        <p className="text-sm text-green-700">
                          Âge: {calculateAge(selectedPatient.date_naissance)} ans • Sexe: {selectedPatient.sexe === 'M' ? 'Masculin' : 'Féminin'}
                        </p>
                        {selectedPatient.antecedents_medicaux && (
                          <p className="text-sm text-green-700 mt-1">
                            Antécédents: {selectedPatient.antecedents_medicaux}
                          </p>
                        )}
                        {selectedPatient.allergies && (
                          <p className="text-sm text-red-700 mt-1">
                            ⚠️ Allergies: {selectedPatient.allergies}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={clearPatientSelection}
                        className="text-green-600 hover:text-green-800 font-medium text-sm"
                      >
                        Changer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
                    Les informations du patient sont remplies automatiquement
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Symptômes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Debug info */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Debug: {symptomsSuggestions.length} symptômes chargés, 
                  Loading: {loadingSuggestions ? 'Oui' : 'Non'}
                </div>
                
                <Autocomplete
                  label="Ajouter un symptôme"
                  placeholder="Rechercher un symptôme..."
                  suggestions={symptomsSuggestions}
                  onSelect={addSymptom}
                  loading={loadingSuggestions}
                  helperText="Tapez pour rechercher ou appuyez sur Entrée pour ajouter"
                />

                {symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {symptoms.map((symptom) => (
                      <Badge
                        key={symptom}
                        variant="info"
                        className="cursor-pointer hover:bg-red-100 px-3 py-1"
                        onClick={() => removeSymptom(symptom)}
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
                  helperText="Sélectionnez une analyse puis entrez la valeur"
                />

                {Object.keys(analyses).length > 0 && (
                  <div className="space-y-2">
                    {Object.keys(analyses).map((analysisWithResult) => (
                      <div key={analysisWithResult} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{analysisWithResult}</span>
                        <button
                          type="button"
                          onClick={() => removeAnalysis(analysisWithResult)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
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
                Lancer le diagnostic
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        <div>
          {results ? (
            <Card>
              <CardHeader>
                <CardTitle>Résultats du diagnostic</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Debug info */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-4">
                  Debug: {JSON.stringify(Object.keys(results))}
                </div>
                
                <div className="space-y-4">
                  {(results.diagnostics || results.data?.diagnostics || []).length > 0 ? (
                    (results.diagnostics || results.data?.diagnostics || []).map((diagnostic, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${getUrgencyColor(
                          diagnostic.urgence
                        )}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">{diagnostic.maladie}</h3>
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
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Urgence:</span>
                            <span className="capitalize">{diagnostic.urgence}</span>
                          </div>

                          {diagnostic.examens_recommandes?.length > 0 && (
                            <div>
                              <p className="font-medium mb-1">Examens recommandés:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {diagnostic.examens_recommandes.map((examen, i) => (
                                  <li key={i}>{examen}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Aucun diagnostic trouvé</p>
                      <p className="text-sm mt-2">Structure de la réponse : {JSON.stringify(results, null, 2)}</p>
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
                {selectedPatient && !consultationSaved && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-lg mb-3">
                      💾 Enregistrer la consultation
                    </h3>
                    
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
                            Enregistrement en cours...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Enregistrer la consultation
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        La consultation sera enregistrée dans le dossier du patient
                      </p>
                    </div>
                  </div>
                )}

                {/* Consultation saved confirmation */}
                {consultationSaved && (
                  <Alert variant="success" className="mt-6">
                    <div className="flex items-center gap-2">
                      <Save className="w-5 h-5" />
                      <div>
                        <p className="font-semibold">Consultation enregistrée avec succès !</p>
                        <p className="text-sm mt-1">
                          La consultation a été ajoutée au dossier de {selectedPatient?.prenom} {selectedPatient?.nom}
                        </p>
                      </div>
                    </div>
                  </Alert>
                )}

                {/* Button to generate recommended analyses */}
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
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          🔬 Générer les analyses recommandées
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Le système va suggérer les analyses biologiques les plus pertinentes
                      pour affiner le diagnostic
                    </p>
                  </div>
                )}

                {/* Recommended analyses list */}
                {recommendedAnalyses.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-3">
                      📋 Analyses recommandées ({recommendedAnalyses.length})
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
                              Recommandée par {analysis.recommended_by} maladie(s) • 
                              Priorité: <span className={`font-medium ${
                                analysis.priority === 'high' ? 'text-red-600' :
                                analysis.priority === 'medium' ? 'text-orange-600' :
                                'text-blue-600'
                              }`}>{
                                analysis.priority === 'high' ? 'Haute' :
                                analysis.priority === 'medium' ? 'Moyenne' :
                                'Basse'
                              }</span>
                            </p>
                            {analysis.diseases && analysis.diseases.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Pour: {analysis.diseases.join(', ')}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => addRecommendedAnalysis(analysis.name)}
                          >
                            Ajouter
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Alert variant="info" className="mt-4">
                      <p className="text-sm">
                        💡 Ajoutez les analyses souhaitées, saisissez leurs valeurs, puis relancez le diagnostic pour un résultat plus précis.
                      </p>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Remplissez le formulaire et lancez le diagnostic pour voir les résultats
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Consultation
