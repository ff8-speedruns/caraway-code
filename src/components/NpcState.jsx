import PropTypes from "prop-types";
import { Stack, Text } from "@mantine/core";

export default function NpcState({ label, value }) {
    return (
        <Stack gap={0}>
            <Text c="blue.1" fz={10} tt="uppercase" lh={1.2}>
                {label}
            </Text>
            <Text c="white" fw={600} fz="xs" lh={1.2}>
                {value ?? "-"}
            </Text>
        </Stack>
    );
}

NpcState.propTypes = {
    label: PropTypes.node.isRequired,
    value: PropTypes.node,
};
