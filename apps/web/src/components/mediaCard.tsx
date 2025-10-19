import { Box, Card, Flex, Inset, Text } from "@radix-ui/themes";

const MediaCard = () => {
  return (
    <Box maxWidth="240px">
      <Flex direction="column" gap="2">
        <Card>
          <Inset clip="padding-box" side="all">
            <img
              src="https://images.unsplash.com/photo-1617050318658-a9a3175e34cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80"
              alt="Bold typography"
              style={{
                display: "block",
                objectFit: "cover",
                width: "100%",
                aspectRatio: "16/9",
              }}
            />
          </Inset>
        </Card>
        <Box>
          <Text as="div" size="2" weight="bold">
            Teodros Girmay
          </Text>
          <Text as="div" size="2" color="gray">
            Engineering
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default MediaCard;
