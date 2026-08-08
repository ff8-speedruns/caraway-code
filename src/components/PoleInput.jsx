import PropTypes from "prop-types";
import { Checkbox, Group, Input, Select, Stack } from "@mantine/core";
import { POLE_OPTIONS } from "../lib/caraway";

export default function PoleInput({ position, value, unfinished, active, onChange, onUnfinishedChange, onFocus }) {
    // The checkbox sits next to the label rather than inside it, so that
    // clicking it doesn't also trigger the label and open the dropdown.
    const inputId = `pole-${position}`;

    return (
        <Stack gap={4}>
            <Group gap={4} justify="space-between" wrap="nowrap">
                <Input.Label htmlFor={inputId}>{`Pole ${position + 1}`}</Input.Label>
                <Checkbox
                    size="xs"
                    checked={unfinished}
                    onChange={(event) => onUnfinishedChange(event.currentTarget.checked)}
                    label="unfinished"
                    labelProps={{ fz: 11 }}
                    styles={{ label: { paddingInlineStart: 4 } }}
                />
            </Group>

            <Select
                id={inputId}
                data={POLE_OPTIONS}
                value={unfinished ? null : value}
                placeholder="?"
                onChange={(next) => onChange(next ?? "")}
                onFocus={onFocus}
                disabled={unfinished}
                allowDeselect={false}
                success={active ? " " : undefined}
                size="md"
            />
        </Stack>
    );
}

PoleInput.propTypes = {
    position: PropTypes.number.isRequired,
    value: PropTypes.string.isRequired,
    unfinished: PropTypes.bool.isRequired,
    active: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    onUnfinishedChange: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
};
