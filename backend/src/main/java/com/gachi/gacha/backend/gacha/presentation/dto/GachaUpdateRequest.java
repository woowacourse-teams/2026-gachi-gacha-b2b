package com.gachi.gacha.backend.gacha.presentation.dto;

import com.gachi.gacha.backend.gacha.application.dto.GachaUpdateCommand;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record GachaUpdateRequest(
        @Pattern(regexp = ".*\\S.*", message = "가챠 이름은 공백일 수 없습니다.")
        String name,
        String caption,
        @Size(max = 1000, message = "썸네일 URL은 1000자를 초과할 수 없습니다.")
        String thumbnailUrl,
        String category
) {
    public GachaUpdateCommand toCommand() {
        return GachaUpdateCommand.builder()
                .name(name)
                .caption(caption)
                .thumbnailUrl(thumbnailUrl)
                .category(category)
                .build();
    }
}
