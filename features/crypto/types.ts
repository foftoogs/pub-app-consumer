export interface ConsumerKeyPair {
  id: string;
  consumer_id: string;
  public_key: string;
  device_id: string;
  is_active: boolean;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}
