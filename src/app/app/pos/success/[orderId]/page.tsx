import { SuccessClient } from "./SuccessClient";

export default async function PosSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <SuccessClient orderId={orderId} />;
}
