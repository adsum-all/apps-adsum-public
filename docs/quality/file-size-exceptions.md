# File-size exceptions (documented)

Per the CODE-THRESHOLDS-POLICY, a file may exceed the 500-line hard block when
documented here with a justification and a plan. The CI file-size gate skips the
files listed below.

## Exceptions

- src/components/Emargement.tsx (506 lines): the public external check-in screen
  (identification, consent, signature, confirmation). Just over the limit; to be
  split by extracting the identification step and the confirmation step into
  their own components.

## Rule

The absolute maximum remains 750 lines. Remove an entry as soon as its file is
split back under 500.
