import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Accordion, Anchor, Button, Center, Group, List, Select, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconCaretRightFilled } from "@tabler/icons-react";
import { DPad, ToolShell } from "@ff8-speedruns/ui";
import { LIKELY_RANGE, OPTIONS, POLE_OPTIONS, findCode } from "./lib/caraway";
import ResultCard from "./components/ResultCard";

const POLE_COUNT = OPTIONS.polesArrSize;

export default function App() {
    const [poles, setPoles] = useState(() => Array(POLE_COUNT).fill(""));
    const [active, setActive] = useState(0);

    // Read inside handleDPad instead of closing over `active` directly, so the
    // callback's identity stays stable across re-renders.
    const activeRef = useRef(active);
    useEffect(() => {
        activeRef.current = active;
    }, [active]);

    // A pole pattern can coincidentally repeat elsewhere in the table, far
    // from where this trick actually falls in a real run. Those matches are
    // mathematically valid but not realistic, so they're filtered out here
    // rather than shown as if they were equally plausible.
    const results = useMemo(() => findCode(poles).filter((result) => result.index >= LIKELY_RANGE.min && result.index <= LIKELY_RANGE.max), [poles]);

    const setPole = (position, value) => setPoles((current) => current.map((v, i) => (i === position ? (value ?? "") : v)));

    // The d-pad walks the dropdowns: left/right pick a burst, up/down change its count.
    const handleDPad = useCallback((direction) => {
        if (direction === "left") {
            setActive((current) => Math.max(0, current - 1));
            return;
        }
        if (direction === "right") {
            setActive((current) => Math.min(POLE_COUNT - 1, current + 1));
            return;
        }

        const step = direction === "up" ? 1 : -1;
        setPoles((current) =>
            current.map((value, i) => {
                if (i !== activeRef.current) return value;
                const index = POLE_OPTIONS.findIndex((option) => option.value === value);
                const next = Math.min(POLE_OPTIONS.length - 1, Math.max(0, index + step));
                return POLE_OPTIONS[next].value;
            }),
        );
    }, []);

    return (
        <ToolShell
            title="Caraway Code / Pole Skip"
            status="needsTesters"
            repo="caraway-code"
            intro="Count the poles passing the train window to work out the Caraway mansion code."
            credits={
                <>
                    Based on the work of <Anchor href="https://hyperbolicworld.fr/poteaux/en">Julien Busset</Anchor> and <Anchor href="http://pingval.g1.xrea.com/">Pingval</Anchor>, referencing{" "}
                    <Anchor href="https://docs.google.com/document/d/1k0wViIjYPa6oakFvcwXxwmXj_2O_Q8FL9Ab5XRfsA6I">Amshagar&apos;s research</Anchor>.
                </>
            }
        >
            <Stack gap="lg">
                <SimpleGrid cols={{ base: 3, sm: 6 }}>
                    {poles.map((value, i) => (
                        <Select
                            key={i}
                            label={`Pole ${i + 1}`}
                            data={POLE_OPTIONS}
                            value={value}
                            onChange={(next) => setPole(i, next)}
                            onFocus={() => setActive(i)}
                            allowDeselect={false}
                            success={active === i ? " " : undefined}
                            size="md"
                        />
                    ))}
                </SimpleGrid>

                <Center>
                    <DPad onPress={handleDPad} />
                </Center>

                <Group gap="md" justify="center" wrap="wrap">
                    {results.map((result) => (
                        <ResultCard key={result.index} result={result} />
                    ))}

                    {results.length === 0 && (
                        <Text c="dimmed" ta="center">
                            Enter the pole counts you saw to find matching codes.
                        </Text>
                    )}
                </Group>

                <Center>
                    <Button component="a" href={`${import.meta.env.BASE_URL}practice/`} rightSection={<IconCaretRightFilled size="1rem" />}>
                        Practice
                    </Button>
                </Center>

                <Accordion variant="contained">
                    <Accordion.Item value="how-to">
                        <Accordion.Control>How to use this tool</Accordion.Control>
                        <Accordion.Panel>
                            <Text size="sm" mb="sm">
                                Starts when you board the train to Deling from Galbadia Garden. The same RNG that decides how many poles pass the hallway window also decides the Caraway mansion code.
                            </Text>
                            <List type="ordered" size="sm" spacing="xs">
                                <List.Item>Follow Irvine into the hallway with Selphie and notice that lamp poles pass by the window with a short gap between sets of poles.</List.Item>
                                <List.Item>While mashing through the dialogue, count how many poles pass by the window in each set (an extra-long gap means a set of 0).</List.Item>
                                <List.Item>Once the dialogue is done, hold down to leave the hallway as fast as possible.</List.Item>
                                <List.Item>
                                    If you leave before the last set finishes, enter <strong>?</strong> for it instead of a number.
                                </List.Item>
                                <List.Item>
                                    If there are multiple possible results, you can compare the animations that happen on your way to the mansion with the results shown to narrow it down.
                                </List.Item>
                            </List>
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </Stack>
        </ToolShell>
    );
}
