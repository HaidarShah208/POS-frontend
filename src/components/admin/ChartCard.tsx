"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
};

export function ChartCard(props: ChartCardProps) {
  const { title, children, loading = false, className } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
