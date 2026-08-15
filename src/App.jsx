import { useState } from "react";
import { Accordion, Alert, Anchor, Button, Code, Center, Group, List, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import { IconCaretRightFilled, IconArrowsHorizontal } from "@tabler/icons-react";
import { DPad, ToolShell } from "@ff8-speedruns/ui";
import { POLE_COUNT, POLE_OPTIONS, POLE_WILDCARD, WIDE_SEARCH_MIN_SETS, findCode } from "./lib/caraway";
import NpcReference from "./components/NpcReference";
import PoleInput from "./components/PoleInput";
import ResultCard from "./components/ResultCard";

// A wide search can match hundreds of indices on a short count, so the list is
// capped and the remainder reported.
const MAX_VISIBLE_RESULTS = 12;

export default function App() {
    const [poles, setPoles] = useState(() => Array(POLE_COUNT).fill(""));
    const [unfinished, setUnfinished] = useState(() => Array(POLE_COUNT).fill(false));
    const [active, setActive] = useState(0);
    const [wide, setWide] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // An unfinished burst matches any count, and keeps whatever number was
    // picked before it was ticked so unticking gets it back.
    const counts = poles.map((value, i) => (unfinished[i] ? POLE_WILDCARD : value));
    const results = findCode(counts, { wide });
    const hasCounts = counts.some(Boolean);

    // A wildcard holds its position in the pattern but constrains nothing, so it
    // does not count towards how much the entered sequence can be trusted.
    const countedSets = counts.filter((value) => value && value !== POLE_WILDCARD).length;
    const visible = results.slice(0, MAX_VISIBLE_RESULTS);
    const hidden = results.length - visible.length;

    const setPole = (position, value) => setPoles((current) => current.map((v, i) => (i === position ? (value ?? "") : v)));

    const setPoleUnfinished = (position, checked) => setUnfinished((current) => current.map((v, i) => (i === position ? checked : v)));

    // The d-pad walks the dropdowns: left/right pick a burst, up/down change its count.
    const handleDPad = (direction) => {
        if (direction === "left") {
            setActive((current) => Math.max(0, current - 1));
            return;
        }
        if (direction === "right") {
            setActive((current) => Math.min(POLE_COUNT - 1, current + 1));
            return;
        }

        if (unfinished[active]) return;

        const step = direction === "up" ? 1 : -1;
        setPoles((current) =>
            current.map((value, i) => {
                if (i !== active) return value;
                const index = POLE_OPTIONS.findIndex((option) => option.value === value);
                const next = Math.min(POLE_OPTIONS.length - 1, Math.max(0, index + step));
                return POLE_OPTIONS[next].value;
            }),
        );
    };

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

                {wide && (
                    <Alert color="yellow" title="Wide search">
                        Searching beyond where a normal run lands. Matches are ordered likeliest first and capped at {MAX_VISIBLE_RESULTS} entries.
                        {countedSets > 0 && countedSets < WIDE_SEARCH_MIN_SETS
                            ? ` Only ${countedSets} set${countedSets === 1 ? "" : "s"} entered, most of these are coincidental repeats of the same pole pattern. Enter at least ${WIDE_SEARCH_MIN_SETS} for one trustworthy answer.`
                            : " Check the NPC animations against each candidate to confirm the code."}
                    </Alert>
                )}

                <Group gap="md" justify="center" wrap="wrap">
                    {visible.map((result) => (
                        <ResultCard key={result.index} result={result} showStats={showStats} />
                    ))}

                    {results.length === 0 && !hasCounts && (
                        <Text c="dimmed" ta="center">
                            Enter the pole counts you saw to find matching codes.
                        </Text>
                    )}

                    {results.length === 0 && hasCounts && !wide && (
                        <Text c="dimmed" ta="center">
                            No code matches. If the run did something unusual, the sequence can be valid but fall outside this range, so try widening the search below.
                        </Text>
                    )}

                    {results.length === 0 && hasCounts && wide && (
                        <Text c="dimmed" ta="center">
                            No code matches that sequence anywhere in the searched stream, so at least one count is wrong.
                        </Text>
                    )}
                </Group>

                {hidden > 0 && (
                    <Text c="dimmed" ta="center" size="sm">
                        Showing the {MAX_VISIBLE_RESULTS} likeliest of {results.length} matches.
                    </Text>
                )}

                <Center>
                    <Group gap="md" wrap="wrap" justify="center">
                        <Switch
                            size="sm"
                            label="Stats for nerds"
                            checked={showStats}
                            onChange={(event) => setShowStats(event.currentTarget.checked)}
                        />
                        <Button
                            variant={wide ? "filled" : "default"}
                            color="yellow"
                            onClick={() => setWide((current) => !current)}
                            leftSection={<IconArrowsHorizontal size="1rem" />}
                        >
                            {wide ? "Wide search on" : "Widen search"}
                        </Button>
                        <Button component="a" href={`${import.meta.env.BASE_URL}practice/`} rightSection={<IconCaretRightFilled size="1rem" />}>
                            Practice
                        </Button>
                    </Group>
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
                                <List.Item>If you leave before the last set finishes, tick <Code>?</Code> for it instead of picking a number.</List.Item>
                                <List.Item>The tool will output the code to give the guard at the mansion.</List.Item>
                                <List.Item>If there are multiple possible results, you can compare the animations that happen on your way to the mansion with the results shown to narrow it down.</List.Item>
                            </List>
                        </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item value="npc-reference">
                        <Accordion.Control>NPC animation reference</Accordion.Control>
                        {/* Unmounted while collapsed so none of the clips are fetched until asked for. */}
                        <Accordion.Panel keepMounted={false}>
                            <NpcReference />
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </Stack>
        </ToolShell>
    );
}
