package com.gachi.gacha.backend.gacha.presentation.dto;

import com.gachi.gacha.backend.gacha.application.dto.GachaUpdateCommand;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record GachaUpdateRequest(
        @Pattern(regexp = ".*\\S.*", message = "가챠 이름은 공백일 수 없습니다.")
        String name,
        String caption,
        @Size(max = 1000, message = "썸네일 URL은 1000자를 초과할 수 없습니다.")
        String thumbnailUrl,
        List<@NotBlank(message = "카테고리는 빈 값일 수 없습니다.")
                @Size(max = 100, message = "카테고리는 100자를 초과할 수 없습니다.") String> categories
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
