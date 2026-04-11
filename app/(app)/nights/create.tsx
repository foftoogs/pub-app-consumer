import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useNightsStore } from '@/features/nights/store';

type Step = 'name' | 'date' | 'theme' | 'budget';
const STEPS: Step[] = ['name', 'date', 'theme', 'budget'];

export default function NightCreateScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    return true;
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
            <Text style={styles.label}>What&apos;s the night called?</Text>
            <TextField
              placeholder="e.g. Friday Pub Crawl"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        )}

        {currentStep === 'date' && (
          <View>
            <Text style={styles.label}>When is it?</Text>
            <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
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
            </Pressable>
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
            <TextField
              placeholder="e.g. 80s night, cocktail bars"
              value={theme}
              onChangeText={setTheme}
              autoFocus
            />
          </View>
        )}

        {currentStep === 'budget' && (
          <View>
            <Text style={styles.label}>Budget per person? (optional)</Text>
            <TextField
              placeholder="e.g. 100"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              autoFocus
            />
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.buttons}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>{step === 0 ? 'Cancel' : 'Back'}</Text>
          </Pressable>

          <Button
            label={step === STEPS.length - 1 ? 'Create' : 'Next'}
            onPress={handleNext}
            disabled={!canContinue()}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    inner: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
    },
    progress: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing['3xl'],
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: Radius.pill,
      backgroundColor: colors.border,
    },
    progressDotActive: {
      backgroundColor: colors.primary,
    },
    label: {
      ...Typography.heading,
      color: colors.text,
      marginBottom: Spacing.base,
    },
    dateButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
      padding: Spacing.base,
      backgroundColor: colors.surface,
    },
    dateText: {
      ...Typography.body,
      color: colors.text,
    },
    datePlaceholder: {
      ...Typography.body,
      color: colors.textMuted,
    },
    error: {
      ...Typography.caption,
      color: colors.error,
      marginTop: Spacing.base,
      textAlign: 'center',
    },
    buttons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing['2xl'],
    },
    backButton: {
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.xl,
    },
    backButtonText: {
      ...Typography.button,
      color: colors.textSecondary,
    },
  });
}
