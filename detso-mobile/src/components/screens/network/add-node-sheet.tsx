import React, { useEffect } from 'react';
import { View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/src/components/global/bottom-sheet';
import { Input } from '@/src/components/global/input';
import { Label } from '@/src/components/global/label';
import { Button } from '@/src/components/global/button';
import { Text } from '@/src/components/global/text';
import { useCreateNode, useEditNode, useNetworkNodes } from '@/src/features/network/hooks';
import { useNetworkMapStore } from '@/src/features/network/store';
import { NetworkNode } from '@/src/features/network/types';

// ─── Schema ──────────────────────────────────────────────────────

const addNodeSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi'),
  address: z.string().optional(),
  slot: z.string().optional(),
  parent_id: z.string().optional(),
  notes: z.string().optional(),
});

type AddNodeForm = z.infer<typeof addNodeSchema>;

// ─── Component ───────────────────────────────────────────────────

interface AddNodeSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  editNode?: NetworkNode | null;
  onDismiss: () => void;
}

export function AddNodeSheet({ sheetRef, editNode, onDismiss }: AddNodeSheetProps) {
  const { addNodeType, placedCoordinate, cancelAdd } = useNetworkMapStore();
  const createNode = useCreateNode();
  const editNodeMutation = useEditNode();
  const { data: serversData } = useNetworkNodes('SERVER');

  const isEditing = !!editNode;
  const nodeType = isEditing ? editNode.type : addNodeType;
  const isODP = nodeType === 'ODP';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddNodeForm>({
    resolver: zodResolver(addNodeSchema),
    defaultValues: {
      name: editNode?.name || '',
      address: editNode?.address || '',
      slot: editNode?.slot?.toString() || '',
      parent_id: editNode?.parent_id || '',
      notes: editNode?.notes || '',
    },
  });

  useEffect(() => {
    if (editNode) {
      reset({
        name: editNode.name,
        address: editNode.address || '',
        slot: editNode.slot?.toString() || '',
        parent_id: editNode.parent_id || '',
        notes: editNode.notes || '',
      });
    } else {
      reset({ name: '', address: '', slot: '', parent_id: '', notes: '' });
    }
  }, [editNode, reset]);

  const servers = serversData?.data?.nodes || [];

  const onSubmit = (data: AddNodeForm) => {
    if (isEditing && editNode) {
      editNodeMutation.mutate(
        {
          id: editNode.id,
          data: {
            name: data.name,
            address: data.address || null,
            slot: data.slot ? parseInt(data.slot) : null,
            parent_id: data.parent_id || null,
            notes: data.notes || null,
          },
        },
        {
          onSuccess: () => {
            sheetRef.current?.dismiss();
            reset();
          },
        }
      );
    } else {
      if (!placedCoordinate || !nodeType) return;

      createNode.mutate(
        {
          type: nodeType,
          name: data.name,
          lat: placedCoordinate.lat.toString(),
          long: placedCoordinate.lng.toString(),
          address: data.address || undefined,
          slot: data.slot ? parseInt(data.slot) : undefined,
          parent_id: data.parent_id || undefined,
          notes: data.notes || undefined,
        },
        {
          onSuccess: () => {
            sheetRef.current?.dismiss();
            cancelAdd();
            reset();
          },
        }
      );
    }
  };

  const title = isEditing
    ? `Edit ${nodeType === 'SERVER' ? 'Server' : 'ODP'}`
    : `Tambah ${nodeType === 'SERVER' ? 'Server' : 'ODP'}`;

  const coordText = isEditing
    ? `${editNode.lat}, ${editNode.long}`
    : placedCoordinate
    ? `${placedCoordinate.lat.toFixed(6)}, ${placedCoordinate.lng.toFixed(6)}`
    : '-';

  return (
    <BottomSheet ref={sheetRef} snapPoints={['65%']} onDismiss={onDismiss} enableScroll>
      <BottomSheetHeader>
        <BottomSheetTitle>{title}</BottomSheetTitle>
        <BottomSheetDescription>
          Koordinat: {coordText}
        </BottomSheetDescription>
      </BottomSheetHeader>

      <View className="gap-4">
        {/* Name */}
        <View>
          <Label>Nama *</Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder={isODP ? 'ODP-01' : 'Server Utama'}
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
              />
            )}
          />
        </View>

        {/* Address */}
        <View>
          <Label>Alamat (opsional)</Label>
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Jl. Merdeka Tiang 5"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        {/* Slot (ODP only) */}
        {isODP && (
          <View>
            <Label>Jumlah Slot/Port</Label>
            <Controller
              control={control}
              name="slot"
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="8"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                />
              )}
            />
          </View>
        )}

        {/* Parent Server (ODP only) - simple picker */}
        {isODP && servers.length > 0 && (
          <View>
            <Label>Parent Server *</Label>
            <Controller
              control={control}
              name="parent_id"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {servers.map((server: any) => (
                    <Button
                      key={server.id}
                      variant={value === server.id ? 'primary' : 'outline'}
                      size="sm"
                      onPress={() => onChange(server.id)}
                    >
                      <Text
                        className={`text-xs ${
                          value === server.id ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {server.name}
                      </Text>
                    </Button>
                  ))}
                </View>
              )}
            />
          </View>
        )}

        {/* Notes */}
        <View>
          <Label>Catatan (opsional)</Label>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Catatan tambahan..."
                value={value}
                onChangeText={onChange}
                multiline
              />
            )}
          />
        </View>

        {/* Submit */}
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={createNode.isPending || editNodeMutation.isPending}
        >
          <Text weight="bold" className="text-primary-foreground">
            {createNode.isPending || editNodeMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Text>
        </Button>
      </View>
    </BottomSheet>
  );
}
