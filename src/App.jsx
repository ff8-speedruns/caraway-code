import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Accordion, Anchor, Button, Center, Group, List, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconCaretRightFilled } from "@tabler/icons-react";
import { DPad, ToolShell } from "@ff8-speedruns/ui";
import { LIKELY_RANGE, OPTIONS, POLE_OPTIONS, POLE_WILDCARD, findCode } from "./lib/caraway";
import PoleInput from "./components/PoleInput";
import ResultCard from "./components/ResultCard";

const POLE_COUNT = OPTIONS.polesArrSize;

export default function App() {
    const [poles, setPoles] = useState(() => Array(POLE_COUNT).fill(""));
    const [unfinished, setUnfinished] = useState(() => Array(POLE_COUNT).fill(false));
    const [active, setActive] = useState(0);

    // Read inside handleDPad instead of closing over these directly, so the
    // callback's identity stays stable across re-renders.
    const activeRef = useRef(active);
    const unfinishedRef = useRef(unfinished);
    useEffect(() => {
        activeRef.current = active;
        unfinishedRef.current = unfinished;
    }, [active, unfinished]);

    // An unfinished burst matches any count, and keeps whatever number was
    // picked before it was ticked so unticking gets it back.
    const counts = useMemo(() => poles.map((value, i) => (unfinished[i] ? POLE_WILDCARD : value)), [poles, unfinished]);

    // A pole pattern can coincidentally repeat elsewhere in the table, far
    // from where this trick actually falls in a real run. Those matches are
    // mathematically valid but not realistic, so they're filtered out here
    // rather than shown as if they were equally plausible.
    const results = useMemo(() => findCode(counts).filter((result) => result.index >= LIKELY_RANGE.min && result.index <= LIKELY_RANGE.max), [counts]);

    const setPole = (position, value) => setPoles((current) => current.map((v, i) => (i === position ? (value ?? "") : v)));

    const setPoleUnfinished = (position, checked) => setUnfinished((current) => current.map((v, i) => (i === position ? checked : v)));

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

        if (unfinishedRef.current[activeRef.current]) return;

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
            status="working"
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
                        <PoleInput
                            key={i}
                            position={i}
                            value={value}
                            unfinished={unfinished[i]}
                            active={active === i}
                            onChange={(next) => setPole(i, next)}
                            onUnfinishedChange={(checked) => setPoleUnfinished(i, checked)}
                            onFocus={() => setActive(i)}
                        />
                    ))}
                </SimpleGrid>

                <Center hiddenFrom="sm">
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
                                Getting into the Caraway Mansion requires the player to provide the guard at the entrance with a numerical code, which is normally found at the Tomb of the Unknown King. However, the code is determined by the same RNG that controls the sequence of poles that pass by the window during the Irvine-Selphie dialogue in the hallway of the train to Deling City from Galbadia Garden.
                            </Text>
                            <List type="ordered" size="sm" spacing="xs">
                                <List.Item>Board the train to Deling City after completing the Galbadia Garden story points.</List.Item>
                                <List.Item>Follow Irvine into the hallway with Selphie.</List.Item>
                                <List.Item>Mash through the dialogue while counting the poles that pass by the window (they pass by in groupings of 4-6 sets;  an extra-long gap between sets means a set of 0).</List.Item>
                                <List.Item>Once the dialogue is finished, hold down to leave the hallway ASAP.</List.Item>
                                <List.Item>Note the groups and sequences in the tool.</List.Item>
                                <List.Item>If you leave before the last set finishes, tick <strong>unfinished</strong> for it instead of picking a number.</List.Item>
                                <List.Item>The tool will output the code to give the guard at the mansion.</List.Item>
                                <List.Item>If there are multiple possible results, you can compare the animations that happen on your way to the mansion with the results shown to narrow it down.</List.Item>
                            </List>
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </Stack>
        </ToolShell>
    );
}
