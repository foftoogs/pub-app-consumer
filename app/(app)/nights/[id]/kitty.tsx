import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import {
  Elevation,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/features/auth/store';
import { useNightsStore } from '@/features/nights/store';
import { useKittyStore } from '@/features/kitty/store';
import { KittyContribution } from '@/features/nights/types';

const PRESET_AMOUNTS = [10, 20, 50, 100];

function contributionStatusColor(colors: ThemeColors, status: KittyContribution['status']) {
  switch (status) {
    case 'confirmed':
      return colors.success;
    case 'pending':
      return colors.warning;
    case 'failed':
      return colors.error;
    case 'refunded':
      return colors.textMuted;
  }
}

export default function KittyScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const night = useNightsStore((s) => s.currentNight);
  const consumer = useAuthStore((s) => s.consumer);
  const { kitty, spendLimit, loading, fetchKitty, createKitty, closeKitty, contribute, fetchSpendLimit, updateSpendLimit } = useKittyStore();

  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [contributeModalVisible, setContributeModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [contributeError, setContributeError] = useState('');
  const [spendModalVisible, setSpendModalVisible] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendThreshold, setSpendThreshold] = useState('');
  const [savingSpend, setSavingSpend] = useState(false);

  const isOrganiser = night?.organiser.id === consumer?.id;

  useEffect(() => {
    if (night) {
      fetchKitty(night.id);
      fetchSpendLimit(night.id);
    }
  }, [night?.id]);

  const handleCreate = async () => {
    if (!night) return;
    setCreating(true);
    try {
      await createKitty(night.id);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to create kitty');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!night) return;
    Alert.alert('Close Kitty', 'Are you sure? No more contributions can be made.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          setClosing(true);
          try {
            await closeKitty(night.id);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message ?? 'Failed to close kitty');
          } finally {
            setClosing(false);
          }
        },
      },
    ]);
  };

  const handleContribute = async (amount: number) => {
    if (!night || amount <= 0) return;
    setContributing(true);
    setContributeError('');
    try {
      await contribute(night.id, amount);
      setContributeModalVisible(false);
      setCustomAmount('');
      await fetchKitty(night.id);
    } catch (err: any) {
      setContributeError(err.response?.data?.message ?? 'Failed to contribute');
    } finally {
      setContributing(false);
    }
  };

  const handleSaveSpendLimit = async () => {
    if (!night) return;
    const max = parseFloat(spendAmount);
    if (isNaN(max) || max <= 0) return;
    const threshold = spendThreshold ? parseFloat(spendThreshold) : null;
    setSavingSpend(true);
    try {
      await updateSpendLimit(night.id, max, threshold);
      setSpendModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to save spend limit');
    } finally {
      setSavingSpend(false);
    }
  };

  if (!night) return null;

  if (loading && !kitty) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!kitty) {
    return (
      <View style={styles.centered}>
        <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No Kitty Yet</Text>
        <Text style={styles.emptySubtext}>
          {isOrganiser ? 'Create a shared kitty for the group to pool money.' : 'The organiser hasn\'t created a kitty yet.'}
        </Text>
        {isOrganiser && (
          <Button
            label="Create Kitty"
            onPress={handleCreate}
            loading={creating}
            style={styles.createButton}
          />
        )}
      </View>
    );
  }

  const renderContribution = ({ item }: { item: KittyContribution }) => (
    <View style={styles.contributionRow}>
      <View style={styles.contributionInfo}>
        <Text style={styles.contributionName}>{item.consumer?.name ?? 'Unknown'}</Text>
        <Text style={styles.contributionDate}>
          {new Date(item.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <View style={styles.contributionRight}>
        <Text style={styles.contributionAmount}>${parseFloat(item.amount).toFixed(2)}</Text>
        <View style={[styles.contributionStatus, { backgroundColor: contributionStatusColor(colors, item.status) }]}>
          <Text style={styles.contributionStatusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Kitty Balance</Text>
        <Text style={styles.balanceAmount}>${parseFloat(kitty.total_balance).toFixed(2)}</Text>
        <Text style={styles.balanceCurrency}>{kitty.currency}</Text>
        {kitty.status === 'closed' && (
          <View style={[styles.closedBadge, { backgroundColor: colors.error }]}>
            <Text style={styles.closedBadgeText}>Closed</Text>
          </View>
        )}
      </View>

      {spendLimit && (
        <Pressable style={styles.spendLimitCard} onPress={() => {
          setSpendAmount(spendLimit.max_amount);
          setSpendThreshold(spendLimit.alert_threshold ?? '');
          setSpendModalVisible(true);
        }}>
          <View style={styles.spendLimitHeader}>
            <Text style={styles.spendLimitTitle}>Your Spend Limit</Text>
            <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
          </View>
          <View style={styles.spendBar}>
            <View style={[styles.spendBarFill, { width: `${Math.min(100, (parseFloat(spendLimit.current_spend) / parseFloat(spendLimit.max_amount)) * 100)}%` }]} />
          </View>
          <Text style={styles.spendLimitText}>
            ${parseFloat(spendLimit.current_spend).toFixed(2)} / ${parseFloat(spendLimit.max_amount).toFixed(2)}
          </Text>
        </Pressable>
      )}

      <View style={styles.actions}>
        {kitty.status === 'open' && (
          <Button
            label="Contribute"
            onPress={() => setContributeModalVisible(true)}
            style={styles.actionButton}
          />
        )}
        {!spendLimit && (
          <Button
            label="Set Spend Limit"
            variant="outline"
            onPress={() => setSpendModalVisible(true)}
            style={styles.actionButton}
          />
        )}
        {isOrganiser && kitty.status === 'open' && (
          <Button
            label="Close Kitty"
            variant="outline"
            onPress={handleClose}
            loading={closing}
            style={styles.actionButton}
          />
        )}
      </View>

      <Text style={styles.sectionTitle}>Contributions</Text>
      <FlatList
        data={kitty.contributions}
        keyExtractor={(item) => item.id}
        renderItem={renderContribution}
        contentContainerStyle={kitty.contributions.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <Text style={styles.emptyContributions}>No contributions yet</Text>
        }
      />

      {/* Contribute Modal */}
      <Modal visible={contributeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contribute to Kitty</Text>
            <View style={styles.presetRow}>
              {PRESET_AMOUNTS.map((amount) => (
                <Pressable
                  key={amount}
                  style={({ pressed }) => [styles.presetButton, pressed && styles.presetPressed]}
                  onPress={() => handleContribute(amount)}
                  disabled={contributing}
                >
                  <Text style={styles.presetText}>${amount}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.orText}>or enter custom amount</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={customAmount}
              onChangeText={setCustomAmount}
            />
            {contributeError ? <Text style={styles.errorText}>{contributeError}</Text> : null}
            <Button
              label="Contribute"
              onPress={() => handleContribute(parseFloat(customAmount))}
              loading={contributing}
              disabled={!customAmount || parseFloat(customAmount) <= 0}
              fullWidth
            />
            <Pressable style={styles.cancelButton} onPress={() => setContributeModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Spend Limit Modal */}
      <Modal visible={spendModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Spend Limit</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Max amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={spendAmount}
              onChangeText={setSpendAmount}
            />
            <TextInput
              style={styles.amountInput}
              placeholder="Alert threshold (optional)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={spendThreshold}
              onChangeText={setSpendThreshold}
            />
            <Button
              label="Save"
              onPress={handleSaveSpendLimit}
              loading={savingSpend}
              disabled={!spendAmount || parseFloat(spendAmount) <= 0}
              fullWidth
            />
            <Pressable style={styles.cancelButton} onPress={() => setSpendModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
      backgroundColor: colors.background,
    },
    emptyTitle: {
      ...Typography.subheading,
      color: colors.textMuted,
      marginTop: Spacing.base,
    },
    emptySubtext: {
      ...Typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    createButton: {
      minWidth: 160,
    },
    balanceCard: {
      backgroundColor: colors.surface,
      margin: Spacing.base,
      padding: Spacing.xl,
      borderRadius: Radius.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...Elevation.sm,
    },
    balanceLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    balanceAmount: {
      ...Typography.displayMedium,
      color: colors.text,
    },
    balanceCurrency: {
      ...Typography.caption,
      color: colors.textMuted,
      marginTop: Spacing.xs,
    },
    closedBadge: {
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.md,
    },
    closedBadgeText: {
      ...Typography.label,
      color: colors.textOnPrimary,
    },
    spendLimitCard: {
      backgroundColor: colors.surface,
      marginHorizontal: Spacing.base,
      marginBottom: Spacing.md,
      padding: Spacing.base,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    spendLimitHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    spendLimitTitle: {
      ...Typography.label,
      color: colors.textSecondary,
    },
    spendBar: {
      height: 6,
      backgroundColor: colors.surfaceAlt,
      borderRadius: Radius.sm,
      marginBottom: Spacing.xs,
      overflow: 'hidden',
    },
    spendBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: Radius.sm,
    },
    spendLimitText: {
      ...Typography.caption,
      color: colors.textMuted,
    },
    actions: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.base,
      gap: Spacing.sm,
      marginBottom: Spacing.base,
    },
    actionButton: {
      flex: 1,
    },
    sectionTitle: {
      ...Typography.bodyMedium,
      color: colors.text,
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.sm,
    },
    contributionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    contributionInfo: {
      flex: 1,
    },
    contributionName: {
      ...Typography.body,
      color: colors.text,
    },
    contributionDate: {
      ...Typography.caption,
      color: colors.textMuted,
    },
    contributionRight: {
      alignItems: 'flex-end',
    },
    contributionAmount: {
      ...Typography.bodyMedium,
      color: colors.text,
    },
    contributionStatus: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.sm,
      marginTop: Spacing.xs,
    },
    contributionStatusText: {
      ...Typography.label,
      color: colors.textOnPrimary,
      fontSize: 10,
      textTransform: 'capitalize',
    },
    emptyList: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Spacing['2xl'],
    },
    emptyContributions: {
      ...Typography.caption,
      color: colors.textMuted,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.xl,
    },
    modalTitle: {
      ...Typography.subheading,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    presetRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.base,
    },
    presetButton: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
    presetPressed: {
      backgroundColor: colors.primary,
    },
    presetText: {
      ...Typography.bodyMedium,
      color: colors.text,
    },
    orText: {
      ...Typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    amountInput: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      ...Typography.body,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    errorText: {
      ...Typography.caption,
      color: colors.error,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    cancelButton: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
      marginTop: Spacing.sm,
    },
    cancelText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
  });
}
