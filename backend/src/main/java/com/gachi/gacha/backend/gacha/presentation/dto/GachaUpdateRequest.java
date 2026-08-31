package com.gachi.gacha.backend.gacha.presentation.dto;

import com.gachi.gacha.backend.gacha.application.dto.GachaUpdateCommand;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record GachaUpdateRequest(
        @Pattern(regexp = ".*\\S.*", message = "가챠 이름은 공백일 수 없습니다.")
        String name,
        String caption,
        @Size(max = 1000, message = "썸네일 URL은 1000자를 초과할 수 없습니다.")
        String thumbnailUrl,
        List<@NotNull(message = "카테고리 ID는 필수입니다.")
                @Positive(message = "카테고리 ID는 양수여야 합니다.") Long> categories
) {
    public GachaUpdateCommand toCommand() {
        return GachaUpdateCommand.builder()
                .name(name)
                .caption(caption)
                .thumbnailUrl(thumbnailUrl)
                .categories(categories)
                .build();
    }
}
