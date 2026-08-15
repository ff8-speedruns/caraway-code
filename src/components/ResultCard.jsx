import { Code, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import { NPC_LABELS } from "../lib/caraway";
import NpcState from "./NpcState";

export default function ResultCard({ result, showStats }) {
    return (
        <Paper
            radius="md"
            shadow="sm"
            p="sm"
            style={{
                background: "linear-gradient(-60deg, var(--mantine-color-blue-4) 0%, var(--mantine-color-blue-7) 100%)",
                width: 240,
            }}
        >
            <Group gap="sm" align="center" wrap="nowrap">
                <Stack align="center" justify="center" gap={2} style={{ flexShrink: 0 }}>
                    <Text c="white" fw={700} fz={32} lh={1.1}>
                        {result.code}
                    </Text>
                    <Code color="rgba(0,0,0,0)" c="white" style={{ letterSpacing: "0.15em" }} fw={600} fz={13}>
                        {result.input}
                    </Code>
                    {showStats && (
                        <>
                            <Code color="rgba(0,0,0,0)" c="white" style={{ letterSpacing: "0.15em" }} fz={9}>
                                Index {result.index}
                            </Code>
                            <Code color="rgba(0,0,0,0)" c="blue.1" style={{ letterSpacing: "0.1em" }} fz={9}>
                                {result.rngState}
                            </Code>
                        </>
                    )}
                </Stack>

                <Stack gap={2} style={{ flex: 1 }}>
                    {Object.entries(NPC_LABELS).map(([field, label]) => (
                        <NpcState key={field} label={label} value={result[field]} />
                    ))}
                </Stack>
            </Group>

            {result.backup && (
                <>
                    <Divider my="xs" color="blue.3" opacity={0.35} />
                    <Group justify="center" gap={4}>
                        <Text c="blue.1" fz="xs">
                            Backup
                        </Text>
                        <Text c="white" fw={600} fz="xs">
                            {result.backup.code}
                        </Text>
                        <Code color="rgba(0,0,0,0)" c="white" fz={10}>
                            {result.backup.input}
                        </Code>
                    </Group>
                </>
            )}
        </Paper>
    );
}
