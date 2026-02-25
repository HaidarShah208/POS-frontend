"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_STAFF } from "@/lib/mock-data";

export default function StaffPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staff</h1>
        <p className="text-(--muted-foreground)">Team members</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_STAFF.map((member) => (
          <Card key={member.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-base">{member.name}</CardTitle>
              <Badge variant={member.status === "active" ? "success" : "secondary"}>{member.status}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-(--muted-foreground)">{member.role}</p>
              <p className="text-sm text-(--muted-foreground)">{member.email}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
