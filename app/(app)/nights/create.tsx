import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useNightsStore } from '@/stores/nights';

type Step = 'name' | 'date' | 'theme' | 'budget';
const STEPS: Step[] = ['name', 'date', 'theme', 'budget'];

export default function NightCreateScreen() {
  const createNight = useNightsStore((s) => s.createNight);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [theme, setTheme] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStep = STEPS[step];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const canContinue = () => {
    if (currentStep === 'name') return name.trim().length > 0;
    if (currentStep === 'date') return date !== null;
    return true; // theme and budget are optional
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const night = await createNight({
        name: name.trim(),
        date: date!.toISOString().split('T')[0],
        ...(theme.trim() ? { theme: theme.trim() } : {}),
        ...(budget ? { budget: parseFloat(budget) } : {}),
      });
      router.replace(`/(app)/nights/${night.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.progress}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i <= step && styles.progressDotActive]}
            />
          ))}
        </View>

        {currentStep === 'name' && (
          <View>
            <Text style={styles.label}>What's the night called?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Friday Pub Crawl"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        )}

        {currentStep === 'date' && (
          <View>
            <Text style={styles.label}>When is it?</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={date ? styles.dateText : styles.datePlaceholder}>
                {date
                  ? date.toLocaleDateString('en-AU', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Select a date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date ?? tomorrow}
                mode="date"
                minimumDate={tomorrow}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>
        )}

        {currentStep === 'theme' && (
          <View>
            <Text style={styles.label}>Any theme? (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 80s night, cocktail bars"
              placeholderTextColor="#999"
              value={theme}
              onChangeText={setTheme}
              autoFocus
            />
          </View>
        )}

        {currentStep === 'budget' && (
          <View>
            <Text style={styles.label}>Budget per person? (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 100"
              placeholderTextColor="#999"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              autoFocus
            />
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, (!canContinue() || loading) && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!canContinue() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === STEPS.length - 1 ? 'Create' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  progressDotActive: {
    backgroundColor: '#000',
  },
  label: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  error: {
    color: '#e74c3c',
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
