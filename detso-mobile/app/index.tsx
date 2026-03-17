import React, { useState } from "react";
import { View } from "react-native";
import { Button } from "@/src/components/global/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/global/dialog";

export default function ContohDialogScreen() {
  // State untuk mengontrol terbuka/tertutupnya dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleLogout = () => {
    // Logika logout kamu di sini...
    setIsDialogOpen(false);
    alert("Berhasil Logout!");
  };

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      {/* Tombol Pemicu Dialog */}
      <Button
        title="Keluar Akun"
        variant="destructive"
        onPress={() => setIsDialogOpen(true)}
      />

      {/* Komponen Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apakah Anda yakin?</DialogTitle>
            <DialogDescription>
              Sesi Anda akan diakhiri dan Anda harus login kembali menggunakan
              email dan kata sandi untuk mengakses aplikasi DetsoNet.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            {/* Tombol Batal */}
            <Button
              title="Batal"
              variant="outline"
              size="md"
              className="flex-1" // Agar lebarnya sama rata
              onPress={() => setIsDialogOpen(false)}
            />
            {/* Tombol Konfirmasi */}
            <Button
              title="Ya, Keluar"
              variant="destructive"
              size="md"
              className="flex-1"
              onPress={handleLogout}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
