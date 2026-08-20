import { getChatGPTUser } from "./chatgpt-auth";
import HealthApp from "./HealthApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <HealthApp signedInName={user?.displayName ?? "預覽體驗者"} signedIn={Boolean(user)} />;
}
