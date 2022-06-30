import { Decimal } from "@mrgnlabs/marginfi-client";
import { OptionValues } from "commander";
import { getClientFromOptions } from "./common";

export async function decodeEvent(encodedEvent: string, options: OptionValues) {
  const mfiClient = await getClientFromOptions(options);
  const event = await mfiClient.program.coder.events.decode(encodedEvent);

  if (!event) {
    console.log("Invalid event");
    return;
  }

  console.log("Event: %s", event.name);
  console.log(event.data);

  if (event.name == "UpdateInterestAccumulatorEvent") {
    console.log(
      "UpdateInterestAccumulatorEvent\n\tcurrentTimestamp: %s\n\tdeltaCompoundingPeriods: %s\n\tfeesCollected: %s\n\tutilizationRate: %s\n\tinterestRate: %s",
      // @ts-ignore
      event.data.currentTimestamp.toNumber(),
      // @ts-ignore
      event.data.deltaCompoundingPeriods.toNumber(),
      // @ts-ignore
      Decimal.fromMDecimal(event.data.feesCollected),
      // @ts-ignore
      Decimal.fromMDecimal(event.data.utilizationRate),
      // @ts-ignore
      Decimal.fromMDecimal(event.data.interestRate)
    );
  }
}
