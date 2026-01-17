import { BadRequestException, PipeTransform } from "@nestjs/common";
import type { ZodTypeAny } from "zod";

export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private schema: T) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        code: "BAD_REQUEST",
        message: "Validation failed",
        issues: parsed.error.issues
      });
    }
    return parsed.data;
  }
}

